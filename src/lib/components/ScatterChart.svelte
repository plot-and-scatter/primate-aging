<script lang="ts">
	import { untrack } from 'svelte';
	import { browser } from '$app/environment';
	import { Chart, ScatterController, LineController, LinearScale, PointElement, LineElement, Tooltip, Legend } from 'chart.js';
	import type { DataPoint } from '$lib/types';

	Chart.register(ScatterController, LineController, LinearScale, PointElement, LineElement, Tooltip, Legend);

	let zoomReady = $state(false);

	if (browser) {
		import('chartjs-plugin-zoom').then((mod) => {
			Chart.register(mod.default);
			zoomReady = true;
		});
	}

	type ChartDatasets = {
		points: DataPoint[];
		median: DataPoint[];
		mean: DataPoint[];
	};

	interface Props {
		data: ChartDatasets;
		label: string;
		yAxisLabel: string;
		overlay?: ChartDatasets | null;
		overlayLabel?: string;
		overlayYAxisLabel?: string;
	}

	let { data, label, yAxisLabel, overlay = null, overlayLabel = 'Overlay', overlayYAxisLabel = '' }: Props = $props();

	let basePoints = $derived(data.points.length);
	let overlayPoints = $derived(overlay ? overlay.points.length : 0);

	let canvas: HTMLCanvasElement;
	let chart: Chart | null = null;

	function buildDatasets(currentData: ChartDatasets, currentLabel: string, currentOverlay: ChartDatasets | null, currentOverlayLabel: string, useSecondYAxis: boolean) {
		// Cool colors for base data (blue family)
		// Legend order: Biomarker, Mean, Median (lower order = drawn first/behind)
		const datasets: any[] = [
			{
				label: currentLabel,
				data: currentData.points,
				backgroundColor: 'rgba(59, 130, 246, 0.3)', // Blue
				pointRadius: 2,
				pointStyle: 'circle',
				borderWidth: 0,
				order: 1,
				yAxisID: 'y'
			},
			{
				label: 'Mean',
				data: currentData.mean,
				backgroundColor: 'rgba(34, 197, 94, 0.9)', // Bright green
				borderColor: 'rgba(22, 128, 61, 1)', // Darker green
				borderWidth: 1,
				pointRadius: 5,
				pointStyle: 'rect',
				order: 2,
				yAxisID: 'y'
			},
			{
				label: 'Median',
				data: currentData.median,
				backgroundColor: 'rgba(139, 92, 246, 0.9)', // Purple/Violet
				borderColor: 'rgba(91, 33, 182, 1)', // Darker purple
				borderWidth: 1,
				pointRadius: 5,
				pointStyle: 'triangle',
				order: 3,
				yAxisID: 'y'
			}
		];

		// Warm colors for overlay data (orange/red family)
		if (currentOverlay) {
			const overlayYAxis = useSecondYAxis ? 'y1' : 'y';
			datasets.push(
				{
					label: currentOverlayLabel,
					data: currentOverlay.points,
					backgroundColor: 'rgba(249, 115, 22, 0.3)', // Orange
					pointRadius: 2,
					pointStyle: 'circle',
					borderWidth: 0,
					order: 4,
					yAxisID: overlayYAxis
				},
				{
					label: 'Overlay Mean',
					data: currentOverlay.mean,
					backgroundColor: 'rgba(245, 158, 11, 0.9)', // Amber/Yellow
					borderColor: 'rgba(180, 83, 9, 1)', // Darker amber
					borderWidth: 1,
					pointRadius: 5,
					pointStyle: 'rect',
					order: 5,
					yAxisID: overlayYAxis
				},
				{
					label: 'Overlay Median',
					data: currentOverlay.median,
					backgroundColor: 'rgba(239, 68, 68, 0.9)', // Red
					borderColor: 'rgba(153, 27, 27, 1)', // Darker red
					borderWidth: 1,
					pointRadius: 5,
					pointStyle: 'triangle',
					order: 6,
					yAxisID: overlayYAxis
				}
			);
		}

		return datasets;
	}

	$effect(() => {
		if (!canvas || !zoomReady) return;

		// Read props to create dependencies
		const currentData = data;
		const currentLabel = label;
		const currentYAxisLabel = yAxisLabel;
		const currentOverlay = overlay;
		const currentOverlayLabel = overlayLabel;
		const currentOverlayYAxisLabel = overlayYAxisLabel;

		// Determine if we need a second y-axis (different measurements)
		const useSecondYAxis = Boolean(currentOverlay && currentOverlayYAxisLabel && currentOverlayYAxisLabel !== currentYAxisLabel);

		// Do the actual work without tracking
		untrack(() => {
			const datasets = buildDatasets(currentData, currentLabel, currentOverlay, currentOverlayLabel, useSecondYAxis);

			// Build scales config
			const scales: any = {
				x: {
					title: { display: true, text: 'Age (years)' }
				},
				y: {
					type: 'linear',
					position: 'left',
					title: { display: true, text: currentYAxisLabel }
				}
			};

			if (useSecondYAxis) {
				scales.y1 = {
					type: 'linear',
					position: 'right',
					title: { display: true, text: currentOverlayYAxisLabel, color: 'rgba(249, 115, 22, 1)' },
					grid: { drawOnChartArea: false },
					ticks: { color: 'rgba(249, 115, 22, 0.8)' }
				};
			}

			if (!chart) {
				// Create chart only once
				chart = new Chart(canvas, {
					type: 'scatter',
					data: { datasets },
					options: {
						responsive: true,
						maintainAspectRatio: false,
						animation: false,
						plugins: {
							legend: {
								display: true,
								position: 'top'
							},
							zoom: {
								zoom: {
									wheel: { enabled: true },
									pinch: { enabled: true },
									drag: {
										enabled: true,
										backgroundColor: 'rgba(59, 130, 246, 0.2)',
										borderColor: 'rgba(59, 130, 246, 0.8)',
										borderWidth: 1
									},
									mode: 'xy'
								},
								pan: {
									enabled: true,
									mode: 'xy',
									modifierKey: 'shift'
								}
							}
						},
						scales
					}
				});
			} else {
				// Update existing chart
				chart.data.datasets = datasets;
				chart.options.scales = scales;
				chart.update('none');
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
	<div class="h-96 xl:h-[32rem]">
		<canvas bind:this={canvas}></canvas>
	</div>
	<div class="flex justify-between items-center mt-2">
		<div class="text-sm text-gray-600">
			Data points:
			<span class="text-blue-600 ml-1">{label}: {basePoints.toLocaleString()}</span>
			{#if overlay}
				<span class="mx-2">|</span>
				<span class="text-orange-600">{overlayLabel}: {overlayPoints.toLocaleString()}</span>
			{/if}
		</div>
		<button
			onclick={() => chart?.resetZoom()}
			class="text-sm px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded"
		>
			Reset Zoom
		</button>
	</div>
</div>
