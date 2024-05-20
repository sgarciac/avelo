/**
 * Welcome to Cloudflare Workers!
 *
 * This is a template for a Scheduled Worker: a Worker that can run on a
 * configurable interval:
 * https://developers.cloudflare.com/workers/platform/triggers/cron-triggers/
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Run `curl "http://localhost:8787/__scheduled?cron=*+*+*+*+*"` to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.toml`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import { getDatabase } from './db';

export default {
	// The scheduled handler is invoked at the interval set in our wrangler.toml's
	// [[triggers]] configuration.
	async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
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
			console.log(station.name);
		}
	},
};

function getEdtDate(date: Date) {
	var utc = date.getTime() + date.getTimezoneOffset() * 60000;
	return new Date(utc - 4 * 60 * 60 * 1000);
}
