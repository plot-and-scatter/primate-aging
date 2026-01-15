<script lang="ts">
	import { untrack } from 'svelte';
	import MeasurementDropdown from '$lib/components/MeasurementDropdown.svelte';
	import SpeciesFilter from '$lib/components/SpeciesFilter.svelte';
	import ScatterChart from '$lib/components/ScatterChart.svelte';
	import type { Measurement, DataPoint } from '$lib/types';
	import { loadMeasurements, loadSubjects } from '$lib/csv-utils';

	let measurements: Measurement[] = $state([]);
	let selected: string = $state('');
	let preview: string = $state('');

	let allSpecies: string[] = $state([]);
	let selectedSpecies: Set<string> = $state(new Set());
	let subjectSpecies: Map<string, string> = new Map();

	// Store raw data for preview
	let currentHeaders: string[] = $state([]);
	let currentRows: string[][] = $state([]);

	// Pre-processed data for efficient filtering
	type ProcessedSubjectData = {
		subject: string;
		species: string;
		dataPoints: DataPoint[];
	};
	let processedData: ProcessedSubjectData[] = $state([]);

	async function init() {
		const [subjectsData, measurementsData] = await Promise.all([
			loadSubjects(),
			loadMeasurements()
		]);

		subjectSpecies = subjectsData.subjectSpecies;
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
			currentHeaders = [];
			currentRows = [];
			processedData = [];
			return;
		}

		// Load pre-processed JSON instead of CSV
		const jsonFilename = filename.replace('.csv', '.json');
		const res = await fetch(`/data-optimized/${jsonFilename}`);
		const data: ProcessedSubjectData[] = await res.json();
		processedData = data;

		// Still load CSV for preview display
		const csvRes = await fetch(`/data/${filename}`);
		const text = await csvRes.text();
		const lines = text.trim().split('\n');
		preview = lines.slice(0, 6).join('\n');
		currentHeaders = lines[0].split(',');
		currentRows = lines.slice(1).map((line) => line.split(','));
	}

	function extractChartData(data: ProcessedSubjectData[], speciesFilter: Set<string>): DataPoint[] {
		// Single pass: filter subjects and collect their point arrays
		const filteredItems: ProcessedSubjectData[] = [];
		let totalPoints = 0;

		for (let i = 0; i < data.length; i++) {
			const item = data[i];
			if (speciesFilter.has(item.species)) {
				filteredItems.push(item);
				totalPoints += item.dataPoints.length;
			}
		}

		if (totalPoints === 0) return [];

		// Pre-allocate and fill (no more species checking needed)
		const result = new Array(totalPoints);
		let idx = 0;
		for (let i = 0; i < filteredItems.length; i++) {
			const points = filteredItems[i].dataPoints;
			for (let j = 0; j < points.length; j++) {
				result[idx++] = points[j];
			}
		}

		return result;
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
	let chartLabel = $derived(
		selectedMeasurement ? `${selectedMeasurement.measurement} (${selectedMeasurement.unit})` : selected
	);
	let yAxisLabel = $derived(selectedMeasurement?.unit || 'Value');

	// Efficiently filter pre-processed data when species selection changes
	let chartData = $derived.by(() => {
		// Read reactive dependencies
		const data = processedData;
		const filter = selectedSpecies;

		// Do computation without tracking to avoid proxy overhead
		return untrack(() => extractChartData(data, filter));
	});
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
