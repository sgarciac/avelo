-- Migration number: 0003 	 2024-05-21T15:38:39.731Z
CREATE INDEX state_station_id_timestamp_index ON state (station_id, timestamp);
CREATE INDEX state_timestamp_index ON state (timestamp);
