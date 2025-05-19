import { AutoRouter } from "itty-router";

export type StationStatus = "PLANNED" | "IN_SERVICE" | "MAINTENANCE";

async function current(): Promise<Response> {
  let stations: {
    [key: number]: {
      id: number;
      status?: StationStatus;
      bikes?: number;
      free_docks?: number;
      name: string;
      lat?: number;
      long?: number;
    };
  } = {};

  const stationInformation = (
    await (
      await fetch(
        "https://quebec.publicbikesystem.net/customer/gbfs/v2/en/station_information"
      )
    ).json<any>()
  ).data.stations;

  const stationStatus = (
    await (
      await fetch(
        "https://quebec.publicbikesystem.net/customer/gbfs/v2/en/station_status"
      )
    ).json<any>()
  ).data.stations;

  for (const station of stationInformation) {
    const station_id = parseInt(station.station_id);
    stations[station_id] = {
      id: station_id,
      name: station.name,
      lat: station.lat,
      long: station.lon,
    };
  }

  for (const station of stationStatus) {
    if (stations[station.station_id] != null) {
      const station_id = parseInt(station.station_id);
      stations[station_id] = {
        ...stations[station_id],
        status: station.status,
        bikes: station.num_bikes_available,
        free_docks: station.num_docks_available,
      };
    }
  }

  return Response.json(Object.values(stations));
}

// ROUTING

const router = AutoRouter();

router.get("/current", () => current());

export default { ...router }; // see note below
