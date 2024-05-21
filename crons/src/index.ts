/**
 * trigger with:
 * http://localhost:60590/__scheduled?cron=0,5,10,15,20,25,30,35,40,45,50,55+*+*+*+*
 */

import { getDatabase } from './db';

const CURRENT_AVAILABLE_R2_KEY = 'current-available.json';
const CURRENT_AVAILABLE_KIND = 'CURRENT_AVAILABLE';
const SNAPSHOTS_ROOT_URL = 'snapshots.avelytique.gozque.com';

async function save_current_state(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
	console.log('saving current state');
	const currentState = await (
		await env.STATIONS_CURRENT.fetch(new Request('http://127.0.0.1/current'))
	).json<
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

	await env.SNAPSHOTS.put(
		CURRENT_AVAILABLE_R2_KEY,
		JSON.stringify({
			kind: CURRENT_AVAILABLE_KIND,
			label: 'current-available',
			timestamp: currentTime.toISOString(),
			data: stations,
		}),
		{ httpMetadata: { contentType: 'application/json' } },
	);

	await db
		.insertInto('snapshot')
		.values({
			kind: CURRENT_AVAILABLE_KIND,
			label: 'current-available',
			url: snapshotUrl(CURRENT_AVAILABLE_R2_KEY),
			timestamp: currentTime.toISOString(),
		})
		.execute();
}

function snapshotUrl(key: string): string {
	return `https://${SNAPSHOTS_ROOT_URL}/${key}`;
}

function getEdtDate(date: Date) {
	var utc = date.getTime() + date.getTimezoneOffset() * 60000;
	return new Date(utc - 4 * 60 * 60 * 1000);
}

export default {
	async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
		// Write code for updating your API
		switch (event.cron) {
			case '0,5,10,15,20,25,30,35,40,45,50,55 * * * *': // every 5 minutes
				await save_current_state(event, env, ctx);
				break;
		}
		console.log('cron processed');
	},
};
