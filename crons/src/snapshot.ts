import { Kysely } from 'kysely';
import { Database } from './db';

export const CURRENT_AVAILABLE_R2_KEY = 'current-available.json';
const SNAPSHOTS_ROOT_URL = 'snapshots.avelytique.gozque.com';
export type SnapshotKind = 'CURRENT_AVAILABLE' | 'PAST_24H_STATION_AVAILABILITY' | 'DAILY_STATION_AVAILABILITY' | 'PAST_24H_AVAILABILITY';

interface SnapshotInput<T> {
	kind: SnapshotKind;
	key: string;
	label: string;
	description: string;
	timestamp: Date;
	data: T;
	station_id: number | null;
	station_name: string | null;
}

interface SnapshotDocument<T> {
	kind: SnapshotKind;
	label: string;
	timestamp: string;
	description: string;
	data: T;
	station_id?: number;
	station_name?: string;
}

export async function makeJsonSnapsot<T>(bucket: R2Bucket, db: Kysely<Database>, input: SnapshotInput<T>): Promise<void> {
	await bucket.put(
		input.key,
		JSON.stringify({
			description: input.description,
			kind: input.kind,
			label: input.label,
			timestamp: input.timestamp.toISOString(),
			data: input.data,
			...(input.station_id != null ? { station_id: input.station_id } : {}),
			...(input.station_name != null ? { station_name: input.station_name } : {}),
		}),
		{ httpMetadata: { contentType: 'application/json' } },
	);

	await db.deleteFrom('snapshot').where('url', '=', snapshotUrl(input.key)).execute();

	await db
		.insertInto('snapshot')
		.values({
			kind: input.kind,
			label: input.label,
			url: snapshotUrl(input.key),
			timestamp: input.timestamp.toISOString(),
			station_id: input.station_id,
			station_name: input.station_name,
		})
		.execute();
}

function snapshotUrl(key: string): string {
	return `https://${SNAPSHOTS_ROOT_URL}/${key}`;
}
