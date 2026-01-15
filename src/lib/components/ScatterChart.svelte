<script lang="ts">
	import { untrack } from 'svelte';
	import { Chart, ScatterController, LinearScale, PointElement, Tooltip } from 'chart.js';
	import type { DataPoint } from '$lib/types';

	Chart.register(ScatterController, LinearScale, PointElement, Tooltip);

	interface Props {
		data: DataPoint[];
		label: string;
		yAxisLabel: string;
	}

	let { data, label, yAxisLabel }: Props = $props();

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
				console.log('🎨 Creating new chart with', currentData.length, 'points');
				chart = new Chart(canvas, {
					type: 'scatter',
					data: {
						datasets: [
							{
								label: currentLabel,
								data: currentData,
								backgroundColor: 'rgba(59, 130, 246, 0.5)',
								pointRadius: 2
							}
						]
					},
					options: {
						responsive: true,
						maintainAspectRatio: false,
						animation: false,
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
				chart.data.datasets[0].data = currentData;
				chart.data.datasets[0].label = currentLabel;
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

<div class="h-96">
	<canvas bind:this={canvas}></canvas>
</div>
