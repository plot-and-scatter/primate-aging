<script lang="ts">
	import { Chart, ScatterController, LinearScale, PointElement, Tooltip } from 'chart.js';

	Chart.register(ScatterController, LinearScale, PointElement, Tooltip);

	type Measurement = {
		filename: string;
		measurement: string;
		unit: string;
	};

	type DataPoint = { x: number; y: number };

	let measurements: Measurement[] = $state([]);
	let selected: string = $state('');
	let preview: string = $state('');
	let chartCanvas: HTMLCanvasElement;
	let chart: Chart | null = null;

	async function loadMeasurements() {
		const res = await fetch('/data/measurements.csv');
		const text = await res.text();
		const lines = text.trim().split('\n');

		measurements = lines.slice(1).map((line) => {
			const values = line.split(',');
			return {
				filename: values[0],
				measurement: values[1],
				unit: values[2]
			};
		});
	}

	function parseCSV(text: string): { headers: string[]; rows: string[][] } {
		const lines = text.trim().split('\n');
		const headers = lines[0].split(',');
		const rows = lines.slice(1).map((line) => line.split(','));
		return { headers, rows };
	}

	function extractScatterData(headers: string[], rows: string[][]): DataPoint[] {
		const points: DataPoint[] = [];

		// Find columns that start with 'y' (age columns like y0, y0.25, etc.)
		const ageColumns = headers
			.map((h, i) => ({ header: h, index: i }))
			.filter(({ header }) => header.match(/^y\d/));

		for (const row of rows) {
			for (const { header, index } of ageColumns) {
				const value = row[index];
				if (value && value !== '') {
					const age = parseFloat(header.slice(1)); // Remove 'y' prefix
					const y = parseFloat(value);
					if (!isNaN(age) && !isNaN(y)) {
						points.push({ x: age, y });
					}
				}
			}
		}

		return points;
	}

	async function loadFile(filename: string) {
		if (!filename) {
			preview = '';
			if (chart) {
				chart.destroy();
				chart = null;
			}
			return;
		}

		const res = await fetch(`/data/${filename}`);
		const text = await res.text();
		const lines = text.trim().split('\n');
		preview = lines.slice(0, 6).join('\n');

		const { headers, rows } = parseCSV(text);
		const points = extractScatterData(headers, rows);

		const measurement = measurements.find((m) => m.filename === filename);
		const label = measurement ? `${measurement.measurement} (${measurement.unit})` : filename;

		if (chart) {
			chart.destroy();
		}

		chart = new Chart(chartCanvas, {
			type: 'scatter',
			data: {
				datasets: [
					{
						label,
						data: points,
						backgroundColor: 'rgba(59, 130, 246, 0.5)',
						pointRadius: 2
					}
				]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				scales: {
					x: {
						title: { display: true, text: 'Age (years)' }
					},
					y: {
						title: { display: true, text: measurement?.unit || 'Value' }
					}
				}
			}
		});
	}

	$effect(() => {
		loadMeasurements();
	});

	$effect(() => {
		loadFile(selected);
	});
</script>

<div class="p-8 max-w-4xl mx-auto">
	<h1 class="text-2xl font-bold mb-4">Primate Aging Data</h1>

	<label class="block mb-4">
		<span class="block mb-1 text-sm font-medium">Select measurement:</span>
		<select bind:value={selected} class="border rounded px-3 py-2 w-full max-w-md">
			<option value="">-- Select --</option>
			{#each measurements as m}
				<option value={m.filename}>{m.measurement} ({m.unit})</option>
			{/each}
		</select>
	</label>

	{#if selected}
		<div class="h-96 mb-4">
			<canvas bind:this={chartCanvas}></canvas>
		</div>

		<details class="mt-4">
			<summary class="cursor-pointer text-sm text-gray-600">Raw data preview</summary>
			<pre class="bg-gray-100 p-4 rounded overflow-x-auto text-sm mt-2">{preview}</pre>
		</details>
	{/if}
</div>
