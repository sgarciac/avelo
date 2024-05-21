/**
 * trigger with:
 * http://localhost:60590/__scheduled?cron=0,5,10,15,20,25,30,35,40,45,50,55+*+*+*+*
 */

import { getDatabase } from './db';
import { CURRENT_AVAILABLE_R2_KEY, makeJsonSnapsot as makeJsonSnaphsot } from './snapshot';

export default {
	async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
		// Write code for updating your API
		switch (event.cron) {
			case '0,5,10,15,20,25,30,35,40,45,50,55 * * * *': // every 5 minutes
				await update_past24_hours_availability(event, env, ctx);
				await update_current_state(event, env, ctx);
				break;
		}
		console.log('cron processed');
	},
};

async function update_past24_hours_availability(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
	// Store snapshots of the states for all stations for the past 24 hours
	const currentTime = new Date(); // utc, in cloudflare
	const db = getDatabase(env);
	let stationData = await db
		.selectFrom('state')
		.select(['station_id as id', 'station_name as name'])
		.groupBy(['station_id', 'station_name'])
		.execute();

	let promises: Promise<void>[] = [];
	for (let station of stationData) {
		let states: { bikes: number | null; free_docks: number | null; timestamp: string }[] = [];
		let records = await db
			.selectFrom('state')
			.where('station_id', '=', station.id)
			// @ts-ignore
			.where('timestamp', '>=', new Date(new Date().getTime() - 24 * 60 * 60 * 1000).toISOString())
			.orderBy('timestamp asc')
			.selectAll()
			.execute();
		states = records.map((record) => ({ bikes: record.bikes, free_docks: record.free_docks, timestamp: record.timestamp }));
		promises.push(
			makeJsonSnaphsot<{ bikes: number | null; free_docks: number | null; timestamp: string }[]>(env.SNAPSHOTS, db, {
				data: states,
				description: 'Available bikes and docks for the past 24 hours for ' + station.name + ' ordered from oldest to most recent.',
				key: `past-24h-station-${station.id}-availability.json`,
				label: `past-24h-station-${station.id}-availability`,
				station_id: station.id,
				station_name: station.name,
				timestamp: currentTime,
				kind: 'PAST_24H_STATION_AVAILABILITY',
			}),
		);
	}
	await Promise.allSettled(promises);
}

async function update_current_state(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
	console.log('Updating current state');
	const currentState = await (
		await env.STATIONS_CURRENT.fetch(new Request('http://127.0.0.1/current'))
	) // needs a request so we fake the URL
		.json<
			{
				id: number;
				bikes: number;
				free_docks: number;
				name: string;
			}[]
		>();
	const currentTime = new Date(); // utc, in cloudflare
	const edtTime = getEdtDate(currentTime);
	const db = getDatabase(env);
	const stations: { name: string; id: number; bikes: number | null; free_docks: number | null }[] = [];

	for (const station of currentState) {
		await db
			.insertInto('state')
			.values({
				station_name: station.name,
				station_id: station.id,
				bikes: station.bikes,
				free_docks: station.free_docks,
				timestamp: currentTime.toISOString(),
				edt_minute: edtTime.getMinutes(),
				edt_hour: edtTime.getHours(),
				edt_date: edtTime.getDate(),
				edt_month: edtTime.getMonth(),
				edt_year: edtTime.getFullYear(),
			})
			.execute();
		stations.push({ name: station.name, id: station.id, bikes: station.bikes, free_docks: station.free_docks });
		console.log(station.name);
	}

	// Store the current state as a snapshot
	await makeJsonSnaphsot<{ name: string; id: number; bikes: number | null; free_docks: number | null }[]>(env.SNAPSHOTS, db, {
		data: stations,
		description: 'Current available bikes and docks',
		key: CURRENT_AVAILABLE_R2_KEY,
		label: 'current-available',
		station_id: null,
		station_name: null,
		timestamp: currentTime,
		kind: 'CURRENT_AVAILABLE',
	});
}

function getEdtDate(date: Date) {
	var utc = date.getTime() + date.getTimezoneOffset() * 60000;
	return new Date(utc - 4 * 60 * 60 * 1000);
}
