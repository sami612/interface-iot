<script lang="ts">
	import type { DailyData } from '$lib/daily-data';
	import Chart from '$components/chart.svelte';
	import { onMount } from 'svelte';
	import { Client } from '@jdiamond/mqtt-browser';
	import { Buffer } from 'buffer';

	let temperatureLive: number[] = [];
	let temperatureDay: DailyData[] = [];
	let humidityLive: number[] = [];
	let humidityDay: DailyData[] = [];
	let accelerationLive: number[] = [];
	let accelerationDay: DailyData[] = [];
	let loggerStatus: string;

	const client = new Client({
		url: 'ws://192.168.42.231:8000/mqtt',
		//clientId: `web_${Math.random() * 100}`,
		connectTimeout: 2000,
		reconnect: {
			retries: 3
		},
		logger: (msg) => {
			loggerStatus = msg;
			console.log(msg);
		}
	});

	type Packet = { payload: any };
	onMount(async () => {
		await client.connect();
		await Promise.all([
			client.subscribe('health'),
			client.subscribe('ilkem/temperature'),
			client.subscribe('ilkem/temperature/day'),
			client.subscribe('ilkem/temperature/warn'),
			client.subscribe('ilkem/humidity'),
			client.subscribe('ilkem/humidity/day'),
			client.subscribe('ilkem/humidity/warn'),
			client.subscribe('ilkem/acceleration'),
			client.subscribe('ilkem/acceleration/day'),
			client.subscribe('ilkem/acceleration/warn')
		]);

		client.on('message', (topic: string, message: Buffer) => {
			let packet: Packet;
			try {
				packet = JSON.parse(Buffer.from(message).toString('utf-8')) as Packet;
			} catch (e) {
				console.log(`Message was ${Buffer.from(message).toString('utf-8')}`);
				console.error(e);
				return;
			}

			let payload: any;
			switch (topic) {
				case 'ilkem/temperature':
					payload = parseFloat(packet.payload);
					temperatureLive = [...temperatureLive, payload];
					if (temperatureLive.length > 20) {
						temperatureLive = temperatureLive.splice(1, temperatureLive.length);
					}
					break;

				case 'ilkem/temperature/day':
					break;

				case 'ilkem/temperature/warn':
				case 'ilkem/humidty/warn':
				case 'ilkem/acceleration/warn':
					alert(packet.payload);
					break;

				case 'ilkem/humidity':
					payload = parseFloat(packet.payload);
					humidityLive = [...humidityLive, payload];
					if (humidityLive.length > 20) {
						humidityLive = humidityLive.splice(1, humidityLive.length);
					}
					break;

				case 'ilkem/humidity/day':
					break;

				case 'ilkem/acceleration':
					payload = parseFloat(packet.payload);
					accelerationLive = [...accelerationLive, payload];
					if (accelerationLive.length > 20) {
						accelerationLive = accelerationLive.splice(1, accelerationLive.length);
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

<h1 style="text-align: center">Mosquitto Websockets</h1>

<div>
	<div>
		Subscribed to
		<input id="topic" disabled type="text" /> Status:
		<input id="status" size="80" disabled type="text" bind:value={loggerStatus} />
	</div>

	<!-- TODO: Flip switch led -->

	<form on:submit|preventDefault={onSubmit}>
		Date recherchée (YYYY-MM-DD) :
		<input bind:value={dayQuery} type="text" name="name" />
		<button type="submit" value="Afficher jour" />
	</form>

	<img src="assets/goutte.png" width="18px" height="27px" alt="Goutte" />
	<input type="checkbox" class="flipswitch" id="humidite" name="humidite" />
	<label for="humidite"> Humidité &emsp;</label>

	<img src="assets/thermometre.png" width="12px" height="30px" alt="Thermometre" />
	<input type="checkbox" class="flipswitch" id="temperature" name="temperature" />
	<label for="temperature"> Temperature </label>

	<ul id="ws" style="font-family: 'Courier New', Courier, monospace">
		<Chart
			title="Relevé de température"
			xLabel="Temps (s)"
			yLabel="Température (°C)"
			data={temperatureLive}
		/>
		<Chart
			title="Relevé d'humidité"
			xLabel="Temps (s)"
			yLabel="Humidité g/m<sup>3</sup>"
			data={humidityLive}
		/>
		<Chart
			title="Relevé d'accélération"
			xLabel="Temps (s)"
			yLabel="Accélération sur l'axe x du capteur m/s<sup>2</sup>"
			data={accelerationLive}
		/>
	</ul>
</div>
