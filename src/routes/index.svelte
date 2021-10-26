<script lang="ts">
	import type { DailyData } from '$lib/daily-data';
	import Chart from '$components/chart.svelte';
	import { onDestroy, onMount } from 'svelte';
	import { Buffer } from 'buffer';
	import Mqtt from '$lib/mqtt';

	type LiveData = { x: any[]; y: number[] };
	const topics = [
		'ilkem/temperature',
		'ilkem/humidity',
		'ilkem/acceleration',
		'ilkem/temperature/day',
		'ilkem/humidity/day',
		'ilkem/acceleration/day',
		'ilkem/temperature/warn',
		'ilkem/humidity/warn',
		'ilkem/acceleration/warn'
	];

	// Live data. These arrays will increase each second.
	let temperatureLive: LiveData = {
		x: [],
		y: []
	};
	let humidityLive: LiveData = {
		x: [],
		y: []
	};
	let accelerationLive: LiveData = {
		x: [],
		y: []
	};
	// Daily datas will be filled on request by the user
	let temperatureDay: DailyData[] = [];
	let humidityDay: DailyData[] = [];
	let accelerationDay: DailyData[] = [];
	let mqttStatus: string = 'Not connected.';

	// When the page is fully loaded
	onMount(async () => {
		await Mqtt.connect();
		mqttStatus = 'Connected.';
		await Promise.all(topics.map((topic) => Mqtt.subscribe(topic)));
		mqttStatus = 'Subscribed.';

		Mqtt.on('message', (topic: string, message: Buffer) => {
			let payload = Buffer.from(message).toString('utf-8');
			mqttStatus = `Received from '${topic}': ${payload}`;
			switch (topic) {
				case 'ilkem/temperature':
					// Append payload to temperature.y
					temperatureLive.y = [...temperatureLive.y, parseFloat(payload)];
					// Starting with 0, append i+1
					temperatureLive.x = [
						...temperatureLive.x,
						(temperatureLive.x[temperatureLive.x.length - 1] ?? 0) + 1
					];
					// Shift left if there are more than 20 data
					if (temperatureLive.x.length > 20 || temperatureLive.y.length > 20) {
						temperatureLive.y = temperatureLive.y.splice(1, temperatureLive.y.length);
						temperatureLive.x = temperatureLive.x.splice(1, temperatureLive.x.length);
					}
					break;
				case 'ilkem/humidity':
					// Append payload to humidity.y
					humidityLive.y = [...humidityLive.y, parseFloat(payload)];
					// Starting with 0, append i+1
					humidityLive.x = [
						...humidityLive.x,
						(humidityLive.x[humidityLive.x.length - 1] ?? 0) + 1
					];
					// Shift left if there are more than 20 data
					if (humidityLive.x.length > 20 || humidityLive.y.length > 20) {
						humidityLive.y = humidityLive.y.splice(1, humidityLive.y.length);
						humidityLive.x = humidityLive.x.splice(1, humidityLive.x.length);
					}
					break;
				case 'ilkem/acceleration':
					// Append payload to acceleration.y
					accelerationLive.y = [...accelerationLive.y, parseFloat(payload)];
					// Starting with 0, append i+1
					accelerationLive.x = [
						...accelerationLive.x,
						(accelerationLive.x[accelerationLive.x.length - 1] ?? 0) + 1
					];
					// Shift left if there are more than 20 data
					if (accelerationLive.x.length > 20 || accelerationLive.y.length > 20) {
						accelerationLive.y = accelerationLive.y.splice(1, accelerationLive.y.length);
						accelerationLive.x = accelerationLive.x.splice(1, accelerationLive.x.length);
					}
					break;

				case 'ilkem/temperature/warn':
				case 'ilkem/humidty/warn':
				case 'ilkem/acceleration/warn':
					alert(payload);
					break;

				case 'ilkem/temperature/day':
					temperatureDay = JSON.parse(payload);
					break;
				case 'ilkem/humidity/day':
					humidityDay = JSON.parse(payload);
					break;
				case 'ilkem/acceleration/day':
					accelerationDay = JSON.parse(payload);
					break;
			}
		});
	});

	async function onSubmit(query: string) {
		if (query) {
			await Mqtt.publish('ilkem/search/day', query);
			mqttStatus = `Published to 'ilkem/search/day': ${query}`;
		}
	}

	let dayQuery: string;
	$: onSubmit(dayQuery); // If dayQuery change, onSubmit is automatically executed

	async function onDisarm() {
		await Mqtt.publish('ilkem/disarm', '{}');
		mqttStatus = "Published to 'ilkem/disarm'";
	}

	// If the page is destroyed, kill the client
	onDestroy(async () => {
		if (Mqtt.everConnected) {
			await Mqtt.disconnect();
			mqttStatus = 'Disconnected.';
		}
	});
</script>

<section class="hero is-success is-fullheight">
	<p class="title p-4">Mosquitto Websockets</p>
	<div class="container">
		Subscribed to
		<input class="input" id="topic" disabled type="text" value={topics.join(', ')} />
		Status:
		<input
			class="input"
			id="status"
			style="text-overflow: ellipsis;"
			size="80"
			disabled
			type="text"
			value={mqttStatus}
		/>
	</div>

	<div class="container">
		<form on:submit|preventDefault={() => onSubmit(dayQuery)}>
			<label class="label" for="name">Date recherchée</label>
			<div class="field has-addons">
				<div class="control">
					<input
						class="input"
						bind:value={dayQuery}
						type="date"
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
		<button class="button is-danger" on:click={onDisarm}>Réarmer</button>
	</div>
</section>

{#if !dayQuery}
	<section class="hero is-primary is-medium">
		<Chart
			title="Relevé de température"
			xLabel="Temps (s)"
			yLabel="Température (°C)"
			xData={temperatureLive.x}
			yData={temperatureLive.y}
		/>
	</section>
	<section class="hero is-success is-medium">
		<Chart
			title="Relevé d'humidité"
			xLabel="Temps (s)"
			yLabel="Humidité (%)"
			xData={humidityLive.x}
			yData={humidityLive.y}
		/>
	</section>
	<section class="hero is-info is-medium">
		<Chart
			title="Relevé d'accélération"
			xLabel="Temps (s)"
			yLabel="Accélération sur l'axe x du capteur cm/s²"
			xData={accelerationLive.x}
			yData={accelerationLive.y}
		/>
	</section>
{:else}
	<section class="hero is-primary is-medium">
		<Chart
			title="Relevé de température du jour {dayQuery}"
			xLabel="Temps (s)"
			yLabel="Température (°C)"
			yData={temperatureDay.map((dailyData) => dailyData.value)}
			xData={temperatureDay.map((dailyData) => dailyData.time)}
		/>
	</section>
	<section class="hero is-success is-medium">
		<Chart
			title="Relevé d'humidité du jour {dayQuery}"
			xLabel="Temps (s)"
			yLabel="Humidité (%)"
			xData={humidityDay.map((dailyData) => dailyData.time)}
			yData={humidityDay.map((dailyData) => dailyData.value)}
		/>
	</section>
	<section class="hero is-info is-medium">
		<Chart
			title="Relevé d'accélération du jour {dayQuery}"
			xLabel="Temps (s)"
			yLabel="Accélération sur l'axe x du capteur (cm/s²)"
			xData={accelerationDay.map((dailyData) => dailyData.time)}
			yData={accelerationDay.map((dailyData) => dailyData.value)}
		/>
	</section>
{/if}
