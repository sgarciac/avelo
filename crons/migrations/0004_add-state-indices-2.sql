-- Migration number: 0004 	 2024-05-21T17:54:42.922Z
CREATE INDEX state_station_id_station_name_index ON state (station_id, station_name);
