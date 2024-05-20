drop table if exists state;

create table if not exists state (
    id INTEGER PRIMARY KEY, 
    station_id INT not null,
    station_name TEXT not null, 
    bikes INT,
    free_docks INT, 
    timestamp DATETIME not null,
    edt_minute INT not null,
    edt_hour INT not null,
    edt_date INT not null,
    edt_month INT not null,
    edt_year INT not null
);

