<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { Chart, registerables } from 'chart.js';

	// Component parameters
	export let title: string;
	export let xLabel: string;
	export let yLabel: string;
	export let yData: number[];
	export let xData: any[];

	// Chart instance
	let chart: Chart;
	// Char html element. Equivalent to $('#chart').
	let chartEl: HTMLElement;

	// When title change, execute `updateTitle`
	$: updateTitle(title);
	// When xData or yData change, execute `updateGraph`
	$: updateGraph(xData, yData);

	function updateTitle(title: string) {
		// If the whole chart?.data?.datasets[0] is defined
		if (chart?.data?.datasets[0]) {
			chart.data.datasets[0].label = title;
			chart.update();
		}
	}

	function updateGraph(newXData: any[], newYData: number[]) {
		// If the whole chart?.data?.datasets[0] is defined
		if (chart?.data?.datasets[0]) {
			chart.data.labels = newXData;
			chart.data.datasets[0].data = newYData;
			chart.update();
		}
	}

	// When the component is fully created
	onMount(async () => {
		// Enable all options of chart.js
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

	// When the component is destroyed, destroy the instances
	onDestroy(() => {
		chart?.destroy();
	});
</script>

<canvas bind:this={chartEl} class="p-4" style="height: 20em; width: 100%;" />
