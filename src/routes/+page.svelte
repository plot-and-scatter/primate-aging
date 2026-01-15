<script lang="ts">
	import MeasurementDropdown from '$lib/components/MeasurementDropdown.svelte';
	import SpeciesFilter from '$lib/components/SpeciesFilter.svelte';
	import ScatterChart from '$lib/components/ScatterChart.svelte';
	import type { Measurement, DataPoint } from '$lib/types';
	import { loadMeasurements, loadSubjects } from '$lib/csv-utils';

	let measurements: Measurement[] = $state([]);
	let selected: string = $state('');
	let preview: string = $state('');
	let chartData: DataPoint[] = $state([]);

	let allSpecies: string[] = $state([]);
	let selectedSpecies: Set<string> = $state(new Set());

	async function init() {
		const [subjectsData, measurementsData] = await Promise.all([
			loadSubjects(),
			loadMeasurements()
		]);

		allSpecies = subjectsData.allSpecies;
		selectedSpecies = new Set(subjectsData.allSpecies);
		measurements = measurementsData;
	}

	function handleMeasurementSelect(filename: string) {
		selected = filename;
		loadFile(filename);
	}

	async function loadFile(filename: string) {
		if (!filename) {
			preview = '';
			chartData = [];
			return;
		}

		const res = await fetch(`/data/${filename}`);
		const text = await res.text();
		const lines = text.trim().split('\n');
		preview = lines.slice(0, 6).join('\n');

		// Parse CSV and extract scatter data (no filtering)
		const headers = lines[0].split(',');
		const rows = lines.slice(1).map((line) => line.split(','));

		const ageColumns = headers
			.map((h, i) => ({ header: h, index: i }))
			.filter(({ header }) => header.match(/^y\d/));

		const points: DataPoint[] = [];
		for (const row of rows) {
			for (const { header, index } of ageColumns) {
				const value = row[index];
				if (value && value !== '') {
					const age = parseFloat(header.slice(1));
					const y = parseFloat(value);
					if (!isNaN(age) && !isNaN(y)) {
						points.push({ x: age, y });
					}
				}
			}
		}
		chartData = points;
	}

	function toggleSpecies(species: string) {
		const newSet = new Set(selectedSpecies);
		if (newSet.has(species)) {
			newSet.delete(species);
		} else {
			newSet.add(species);
		}
		selectedSpecies = newSet;
	}

	function selectAllSpecies() {
		selectedSpecies = new Set(allSpecies);
	}

	function selectNoneSpecies() {
		selectedSpecies = new Set();
	}

	let initialized = false;
	$effect(() => {
		if (!initialized) {
			initialized = true;
			init();
		}
	});

	let selectedMeasurement = $derived(measurements.find((m) => m.filename === selected));
	let chartLabel = $derived(selectedMeasurement ? `${selectedMeasurement.measurement} (${selectedMeasurement.unit})` : selected);
	let yAxisLabel = $derived(selectedMeasurement?.unit || 'Value');
</script>

<div class="p-8 max-w-4xl mx-auto">
	<h1 class="text-2xl font-bold mb-4">Primate Aging Data</h1>

	<div class="flex flex-wrap gap-6 mb-6">
		<MeasurementDropdown {measurements} {selected} onSelect={handleMeasurementSelect} />
		<SpeciesFilter
			{allSpecies}
			selected={selectedSpecies}
			onToggle={toggleSpecies}
			onSelectAll={selectAllSpecies}
			onSelectNone={selectNoneSpecies}
		/>
	</div>

	{#if selected}
		<ScatterChart data={chartData} label={chartLabel} yAxisLabel={yAxisLabel} />

		<details class="mt-4">
			<summary class="cursor-pointer text-sm text-gray-600">Raw data preview</summary>
			<pre class="bg-gray-100 p-4 rounded overflow-x-auto text-sm mt-2">{preview}</pre>
		</details>
	{/if}
</div>
