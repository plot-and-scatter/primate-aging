<script lang="ts">
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
	let chart: Chart | null = $state(null);

	$effect(() => {
		if (!canvas) return;

		if (chart) {
			chart.destroy();
		}

		chart = new Chart(canvas, {
			type: 'scatter',
			data: {
				datasets: [
					{
						label,
						data,
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
						title: { display: true, text: yAxisLabel }
					}
				}
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
