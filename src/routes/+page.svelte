<script lang="ts">
	import { untrack } from 'svelte';
	import MeasurementDropdown from '$lib/components/MeasurementDropdown.svelte';
	import FilterGroup from '$lib/components/FilterGroup.svelte';
	import ScatterChart from '$lib/components/ScatterChart.svelte';
	import type { Measurement, DataPoint } from '$lib/types';
	import { loadMeasurements, loadSubjects, type SubjectData } from '$lib/csv-utils';

	let measurements: Measurement[] = $state([]);
	let selected: string = $state('');

	// Subject data
	let subjects: Map<string, SubjectData> = new Map();

	// Filter options
	let filterOptions = $state({
		species: [] as string[],
		sex: [] as string[],
		socialEnvironment: [] as string[],
		housing: [] as string[],
		diet: [] as string[]
	});

	// Selected filters
	let selectedFilters = $state({
		species: new Set<string>(),
		sex: new Set<string>(),
		socialEnvironment: new Set<string>(),
		housing: new Set<string>(),
		diet: new Set<string>()
	});

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

		subjects = subjectsData.subjects;
		filterOptions = subjectsData.filterOptions;

		// Select all options by default
		selectedFilters = {
			species: new Set(filterOptions.species),
			sex: new Set(filterOptions.sex),
			socialEnvironment: new Set(filterOptions.socialEnvironment),
			housing: new Set(filterOptions.housing),
			diet: new Set(filterOptions.diet)
		};

		measurements = measurementsData.sort((a, b) => a.measurement.localeCompare(b.measurement));

		// Select the first measurement by default
		if (measurements.length > 0) {
			handleMeasurementSelect(measurements[0].filename);
		}
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

	type Filters = typeof selectedFilters;

	function extractChartData(
		data: ProcessedSubjectData[],
		subjectMap: Map<string, SubjectData>,
		filters: Filters
	): ChartDatasets {
		// Single pass: filter subjects and collect their point arrays
		const filteredItems: ProcessedSubjectData[] = [];
		let totalPoints = 0;

		for (let i = 0; i < data.length; i++) {
			const item = data[i];
			const subjectData = subjectMap.get(item.subject);
			if (!subjectData) continue;

			// Check all filters
			if (
				filters.species.has(subjectData.species) &&
				filters.sex.has(subjectData.sex) &&
				filters.socialEnvironment.has(subjectData.socialEnvironment) &&
				filters.housing.has(subjectData.housing) &&
				filters.diet.has(subjectData.diet)
			) {
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

	function toggleFilter(filterKey: keyof Filters, value: string) {
		const newSet = new Set(selectedFilters[filterKey]);
		if (newSet.has(value)) {
			newSet.delete(value);
		} else {
			newSet.add(value);
		}
		selectedFilters = { ...selectedFilters, [filterKey]: newSet };
	}

	function selectAll(filterKey: keyof Filters) {
		selectedFilters = { ...selectedFilters, [filterKey]: new Set(filterOptions[filterKey]) };
	}

	function selectNone(filterKey: keyof Filters) {
		selectedFilters = { ...selectedFilters, [filterKey]: new Set<string>() };
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

	// Efficiently filter pre-processed data when filter selection changes
	let chartData = $derived.by(() => {
		// Read reactive dependencies
		const data = processedData;
		const subjectMap = subjects;
		const filters = selectedFilters;

		// Do computation without tracking to avoid proxy overhead
		return untrack(() => extractChartData(data, subjectMap, filters));
	});
</script>

<div class="p-8 max-w-7xl mx-auto">
	<div class="flex flex-wrap items-center gap-4 mb-6">
		<h1 class="text-2xl font-bold">Primate Aging Data</h1>
		<MeasurementDropdown {measurements} {selected} onSelect={handleMeasurementSelect} />
	</div>

	<div class="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
		<FilterGroup
			label="Species"
			options={filterOptions.species}
			selected={selectedFilters.species}
			onToggle={(v) => toggleFilter('species', v)}
			onSelectAll={() => selectAll('species')}
			onSelectNone={() => selectNone('species')}
		/>
		<FilterGroup
			label="Sex"
			options={filterOptions.sex}
			selected={selectedFilters.sex}
			onToggle={(v) => toggleFilter('sex', v)}
			onSelectAll={() => selectAll('sex')}
			onSelectNone={() => selectNone('sex')}
		/>
		<FilterGroup
			label="Social environment"
			options={filterOptions.socialEnvironment}
			selected={selectedFilters.socialEnvironment}
			onToggle={(v) => toggleFilter('socialEnvironment', v)}
			onSelectAll={() => selectAll('socialEnvironment')}
			onSelectNone={() => selectNone('socialEnvironment')}
		/>
		<FilterGroup
			label="Housing"
			options={filterOptions.housing}
			selected={selectedFilters.housing}
			onToggle={(v) => toggleFilter('housing', v)}
			onSelectAll={() => selectAll('housing')}
			onSelectNone={() => selectNone('housing')}
		/>
		<FilterGroup
			label="Diet"
			options={filterOptions.diet}
			selected={selectedFilters.diet}
			onToggle={(v) => toggleFilter('diet', v)}
			onSelectAll={() => selectAll('diet')}
			onSelectNone={() => selectNone('diet')}
		/>
	</div>

	{#if selected}
		<ScatterChart data={chartData} label={chartLabel} yAxisLabel={yAxisLabel} />
	{/if}
</div>
