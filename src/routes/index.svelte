<script lang="ts">
	import type { DailyData } from '$lib/daily-data';
	import Chart from '$components/chart.svelte';
	import { onMount } from 'svelte';
	import { Client } from '@jdiamond/mqtt-browser';
	import { Buffer } from 'buffer';

	let temperatureLive: { x: any[]; y: number[] } = {
		x: [],
		y: []
	};
	let temperatureDay: DailyData[] = [];
	let humidityLive: { x: any[]; y: number[] } = {
		x: [],
		y: []
	};
	let humidityDay: DailyData[] = [];
	let accelerationLive: { x: any[]; y: number[] } = {
		x: [],
		y: []
	};
	let accelerationDay: DailyData[] = [];
	let loggerStatus: string;

	const client = new Client({
		//url: 'ws://192.168.42.231:8000/mqtt', // 4g
		url: 'ws://172.16.162.53:8000/mqtt', // school
		clientId: `web_${Math.random() * 100}`,
		connectTimeout: 2000,
		reconnect: {
			retries: 3
		},
		logger: (msg) => {
			loggerStatus = msg;
			console.log(msg);
		}
	});

	onMount(async () => {
		await client.connect();
		await client.subscribe('ilkem/#', 2);

		client.on('message', (topic: string, message: Buffer) => {
			let payload = Buffer.from(message).toString('utf-8');
			let parsed: any;
			switch (topic) {
				case 'ilkem/temperature':
					parsed = parseFloat(payload);
					temperatureLive.y = [...temperatureLive.y, parsed];
					temperatureLive.x = [
						...temperatureLive.x,
						(temperatureLive.x[temperatureLive.x.length - 1] ?? 0) + 1
					];
					if (temperatureLive.y.length > 20) {
						temperatureLive.y = temperatureLive.y.splice(1, temperatureLive.y.length);
						temperatureLive.x = temperatureLive.x.splice(1, temperatureLive.x.length);
					}
					break;

				case 'ilkem/temperature/day':
					break;

				case 'ilkem/temperature/warn':
				case 'ilkem/humidty/warn':
				case 'ilkem/acceleration/warn':
					alert(payload);
					break;

				case 'ilkem/humidity':
					parsed = parseFloat(payload);
					humidityLive.y = [...humidityLive.y, parsed];
					humidityLive.x = [
						...humidityLive.x,
						(humidityLive.x[humidityLive.x.length - 1] ?? 0) + 1
					];
					if (humidityLive.y.length > 20) {
						humidityLive.y = humidityLive.y.splice(1, humidityLive.y.length);
						humidityLive.x = humidityLive.x.splice(1, humidityLive.x.length);
					}
					break;

				case 'ilkem/humidity/day':
					break;

				case 'ilkem/acceleration':
					parsed = parseFloat(payload);
					accelerationLive.y = [...accelerationLive.y, parsed];
					accelerationLive.x = [
						...accelerationLive.x,
						(accelerationLive.x[accelerationLive.x.length - 1] ?? 0) + 1
					];
					if (accelerationLive.y.length > 20) {
						accelerationLive.y = accelerationLive.y.splice(1, accelerationLive.y.length);
						accelerationLive.x = accelerationLive.x.splice(1, accelerationLive.x.length);
					}
					break;

				case 'ilkem/acceleration/day':
					break;
			}
		});
	});

	let dayQuery: string;
	function onSubmit() {
		client.publish('ilkem/search/day', dayQuery);
	}
</script>

<section class="hero is-success is-fullheight">
	<p class="title p-4">Mosquitto Websockets</p>
	<div class="container">
		Subscribed to
		<input class="input" id="topic" disabled type="text" /> Status:
		<input class="input" id="status" size="80" disabled type="text" bind:value={loggerStatus} />
	</div>

	<!-- TODO: Flip switch led -->

	<div class="container">
		<form on:submit|preventDefault={onSubmit}>
			<label class="label" for="name">Date recherchée</label>
			<div class="field has-addons">
				<div class="control">
					<input
						class="input"
						bind:value={dayQuery}
						type="text"
						name="name"
						placeholder="yyyy-MM-dd"
					/>
				</div>
				<div class="control">
					<button type="submit" class="button is-info"> Afficher jour </button>
				</div>
			</div>
		</form>
	</div>

	<div class="container">
		<img src="assets/goutte.png" width="18px" height="27px" alt="Goutte" />
		<input type="checkbox" class="flipswitch" id="humidite" name="humidite" />
		<label for="humidite"> Humidité &emsp;</label>

		<img src="assets/thermometre.png" width="12px" height="30px" alt="Thermometre" />
		<input type="checkbox" class="flipswitch" id="temperature" name="temperature" />
		<label for="temperature"> Temperature </label>
	</div>
</section>
<section class="hero is-primary is-medium">
	<Chart
		title="Relevé de température"
		xLabel="Temps (s)"
		yLabel="Température (°C)"
		bind:yData={temperatureLive.y}
		bind:xData={temperatureLive.x}
	/>
</section>
<section class="hero is-success is-medium">
	<Chart
		title="Relevé d'humidité"
		xLabel="Temps (s)"
		yLabel="Humidité (%)"
		bind:xData={humidityLive.x}
		bind:yData={humidityLive.y}
	/>
</section>
<section class="hero is-info is-medium">
	<Chart
		title="Relevé d'accélération"
		xLabel="Temps (s)"
		yLabel="Accélération sur l'axe x du capteur cm/s²"
		bind:xData={accelerationLive.x}
		bind:yData={accelerationLive.y}
	/>
</section>
