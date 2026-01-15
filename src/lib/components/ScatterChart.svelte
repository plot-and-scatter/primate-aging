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
			if (chart) {
				chart.destroy();
				chart = null;
			}

			const plainData = JSON.parse(JSON.stringify(currentData));

			chart = new Chart(canvas, {
				type: 'scatter',
				data: {
					datasets: [
						{
							label: currentLabel,
							data: plainData,
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
							title: { display: true, text: currentYAxisLabel }
						}
					}
				}
			});
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
