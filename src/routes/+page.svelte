<script lang="ts">
	import MeasurementDropdown from '$lib/components/MeasurementDropdown.svelte';
	import SpeciesFilter from '$lib/components/SpeciesFilter.svelte';
	import type { Measurement } from '$lib/types';
	import { loadMeasurements, loadSubjects } from '$lib/csv-utils';

	let measurements: Measurement[] = $state([]);
	let selected: string = $state('');
	let preview: string = $state('');

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
			return;
		}

		const res = await fetch(`/data/${filename}`);
		const text = await res.text();
		const lines = text.trim().split('\n');
		preview = lines.slice(0, 6).join('\n');
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

	$effect(() => {
		init();
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

	<p class="text-sm text-gray-600">
		Selected measurement: {selected || '(none)'} |
		Species selected: {selectedSpecies.size}/{allSpecies.length}
	</p>

	{#if selected}
		<details class="mt-4">
			<summary class="cursor-pointer text-sm text-gray-600">Raw data preview</summary>
			<pre class="bg-gray-100 p-4 rounded overflow-x-auto text-sm mt-2">{preview}</pre>
		</details>
	{/if}
</div>
