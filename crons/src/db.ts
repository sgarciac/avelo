// THIS FILE SHOULD BE IDENTICAL WITH THOSE OF THE OTHER PROJECTS ACCESSING THE DB
// TOO LAZY TO MAKE THIS SHARED CODE.
import type { ColumnType } from 'kysely';
import { Kysely } from 'kysely';
import { D1Dialect } from 'kysely-d1';

export type Timestamp = ColumnType<Date, Date | string, Date | string>;

export type Generated<T> =
	T extends ColumnType<infer S, infer I, infer U> ? ColumnType<S, I | undefined, U> : ColumnType<T, T | undefined, T>;

export interface State {
	id: Generated<number>;
	station_id: number;
	station_name: string;
	bikes: number | null;
	free_docks: number | null;
	timestamp: Generated<Timestamp>;
	edt_minute: number;
	edt_hour: number;
	edt_date: number;
	edt_month: number;
	edt_year: number;
}

export interface Database {
	state: State;
}

export function getDatabase(env: Env) {
	return new Kysely<Database>({ dialect: new D1Dialect({ database: env.DB }) });
}
