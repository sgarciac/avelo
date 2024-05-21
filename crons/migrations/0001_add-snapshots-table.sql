-- Migration number: 0001 	 2024-05-20T23:42:11.908Z
create table if not exists snapshot (
    id INTEGER PRIMARY KEY, 
    station_id INT, 
    station_name TEXT,
    kind TEXT not null, 
    label TEXT,
    url TEXT not null,
    timestamp DATETIME not null
);