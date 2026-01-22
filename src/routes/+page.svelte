<script lang="ts">
	import { untrack } from 'svelte';
	import MeasurementDropdown from '$lib/components/MeasurementDropdown.svelte';
	import SpeciesFilter from '$lib/components/SpeciesFilter.svelte';
	import ScatterChart from '$lib/components/ScatterChart.svelte';
	import type { Measurement, DataPoint } from '$lib/types';
	import { loadMeasurements, loadSubjects } from '$lib/csv-utils';

	let measurements: Measurement[] = $state([]);
	let selected: string = $state('');

	let allSpecies: string[] = $state([]);
	let selectedSpecies: Set<string> = $state(new Set());
	let subjectSpecies: Map<string, string> = new Map();

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
		measurements = measurementsData.sort((a, b) => a.measurement.localeCompare(b.measurement));
	}

	function handleMeasurementSelect(filename: string) {
		selected = filename;
		loadFile(filename);
	}

	async function loadFile(filename: string) {
		if (!filename) {
			processedData = [];
			return;
		}

		// Load pre-processed JSON instead of CSV
		const jsonFilename = filename.replace('.csv', '.json');
		const res = await fetch(`/data-optimized/${jsonFilename}`);
		const data: ProcessedSubjectData[] = await res.json();
		processedData = data;
	}

	type ChartDatasets = {
		points: DataPoint[];
		median: DataPoint[];
		mean: DataPoint[];
	};

	function extractChartData(data: ProcessedSubjectData[], speciesFilter: Set<string>): ChartDatasets {
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

		if (totalPoints === 0) return { points: [], median: [], mean: [] };

		// Pre-allocate and fill (no more species checking needed)
		const points = new Array(totalPoints);
		let idx = 0;
		for (let i = 0; i < filteredItems.length; i++) {
			const pointsArray = filteredItems[i].dataPoints;
			for (let j = 0; j < pointsArray.length; j++) {
				points[idx++] = pointsArray[j];
			}
		}

		// Calculate median and mean per age
		const pointsByAge = new Map<number, number[]>();
		for (let i = 0; i < points.length; i++) {
			const point = points[i];
			if (!pointsByAge.has(point.x)) {
				pointsByAge.set(point.x, []);
			}
			pointsByAge.get(point.x)!.push(point.y);
		}

		const medianPoints: DataPoint[] = [];
		const meanPoints: DataPoint[] = [];

		for (const [age, values] of pointsByAge) {
			// Calculate mean
			let sum = 0;
			for (let i = 0; i < values.length; i++) {
				sum += values[i];
			}
			const mean = sum / values.length;
			meanPoints.push({ x: age, y: mean });

			// Calculate median
			const sorted = values.slice().sort((a, b) => a - b);
			const mid = Math.floor(sorted.length / 2);
			const median = sorted.length % 2 === 0
				? (sorted[mid - 1] + sorted[mid]) / 2
				: sorted[mid];
			medianPoints.push({ x: age, y: median });
		}

		// Sort median and mean points by age for better visualization
		medianPoints.sort((a, b) => a.x - b.x);
		meanPoints.sort((a, b) => a.x - b.x);

		return { points, median: medianPoints, mean: meanPoints };
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
	{/if}
</div>
