<script lang="ts">
	import { untrack } from 'svelte';
	import { Chart, ScatterController, LinearScale, PointElement, Tooltip, Legend } from 'chart.js';
	import type { DataPoint } from '$lib/types';

	Chart.register(ScatterController, LinearScale, PointElement, Tooltip, Legend);

	type ChartDatasets = {
		points: DataPoint[];
		median: DataPoint[];
		mean: DataPoint[];
	};

	interface Props {
		data: ChartDatasets;
		label: string;
		yAxisLabel: string;
	}

	let { data, label, yAxisLabel }: Props = $props();

	let totalPoints = $derived(data.points.length + data.median.length + data.mean.length);

	let canvas: HTMLCanvasElement;
	let chart: Chart | null = null;

	$effect(() => {
		if (!canvas) return;

		// Read props to create dependencies
		const currentData = data;
		const currentLabel = label;
		const currentYAxisLabel = yAxisLabel;

		// Do the actual work without tracking
		untrack(() => {
			const chartStart = performance.now();

			if (!chart) {
				// Create chart only once
				console.log('🎨 Creating new chart with', currentData.points.length, 'points');
				chart = new Chart(canvas, {
					type: 'scatter',
					data: {
						datasets: [
							{
								label: currentLabel,
								data: currentData.points,
								backgroundColor: 'rgba(59, 130, 246, 0.3)',
								pointRadius: 2,
								order: 3
							},
							{
								label: 'Median',
								data: currentData.median,
								backgroundColor: 'rgba(220, 38, 38, 0.5)',
								pointRadius: 4,
								order: 1
							},
							{
								label: 'Mean',
								data: currentData.mean,
								backgroundColor: 'rgba(34, 197, 94, 0.5)',
								pointRadius: 4,
								order: 2
							}
						]
					},
					options: {
						responsive: true,
						maintainAspectRatio: false,
						animation: false,
						plugins: {
							legend: {
								display: true,
								position: 'top'
							}
						},
						scales: {
							x: {
								title: { display: true, text: 'Age (years)' }
							},
							y: {
								title: { display: true, text: currentYAxisLabel }
							}
						}
					}
				});
			} else {
				// Update existing chart
				chart.data.datasets[0].data = currentData.points;
				chart.data.datasets[0].label = currentLabel;
				chart.data.datasets[1].data = currentData.median;
				chart.data.datasets[2].data = currentData.mean;
				if (chart.options.scales?.y && 'title' in chart.options.scales.y) {
					chart.options.scales.y.title = { display: true, text: currentYAxisLabel };
				}
				chart.update('none'); // Update without animation for speed
			}
		});

		return () => {
			if (chart) {
				chart.destroy();
				chart = null;
			}
		};
	});
</script>

<div>
	<div class="h-96">
		<canvas bind:this={canvas}></canvas>
	</div>
	<div class="text-sm text-gray-600 mt-2 text-center">
		Total data points: {totalPoints.toLocaleString()}
	</div>
</div>
