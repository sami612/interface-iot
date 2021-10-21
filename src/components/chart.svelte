<script lang="ts">
	import { onMount } from 'svelte';
	import type { ChartAPI } from 'c3';

	export let title: string;
	export let xLabel: string;
	export let yLabel: string;
	export let data: number[];

	let chart: ChartAPI;

	onMount(async () => {
		const c3 = await import('c3');
		chart = c3.generate({
			bindto: '#chart',
			data: {
				columns: [[title, ...data]]
			},
			axis: {
				x: {
					label: xLabel
				},
				y: {
					label: yLabel
				}
			}
		});
	});
</script>

<div id="#chart" style="height: 400px; width: 1500px; margin-bottom: 20px" />
