<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { Chart, registerables } from 'chart.js';

	export let title: string;
	export let xLabel: string;
	export let yLabel: string;
	export let yData: number[];
	export let xData: any[];

	let chart: Chart;
	let chartEl: HTMLElement;

	$: updateTitle(title);
	$: updateGraph(xData, yData);

	function updateTitle(title: string) {
		if (chart?.data?.datasets[0]) {
			chart.data.datasets[0].label = title;
			chart.update();
		}
	}

	function updateGraph(newXData: any[], newYData: number[]) {
		if (chart?.data?.datasets[0]) {
			chart.data.labels = newXData;
			chart.data.datasets[0].data = newYData;
			chart.update();
		}
	}

	onMount(async () => {
		Chart.register(...registerables);
		chart = new Chart(chartEl, {
			type: 'line',
			data: {
				labels: xData,
				datasets: [
					{
						label: title,
						backgroundColor: 'rgb(255, 99, 132)',
						borderColor: 'rgb(255, 99, 132)',
						data: yData
					}
				]
			},
			options: {
				responsive: true,
				scales: {
					x: {
						title: {
							display: true,
							text: xLabel
						}
					},
					y: {
						title: {
							display: true,
							text: yLabel
						}
					}
				}
			}
		});
	});

	onDestroy(() => {
		chart?.destroy();
	});
</script>

<canvas bind:this={chartEl} style="height: 400px; width: 1500px; margin-bottom: 20px" />
