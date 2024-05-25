import { WorkerEntrypoint } from "cloudflare:workers";
import { AutoRouter } from "itty-router";

async function consume(stream: ReadableStream) {
  const reader = stream.getReader();
  while (!(await reader.read()).done) {}
}

export class WorkerB extends WorkerEntrypoint {
  async add(a: number, b: number) {
    return a + b;
  }
}

async function current(): Promise<Response> {
  let id: string | null = "";
  let name: string = "";
  let geocoordinatesString: any;
  let availabilityString: any;

  let stations: {
    [key: number]: {
      id: number;
      bikes?: number;
      free_docks?: number;
      name: string;
      lat?: number;
      long?: number;
    };
  } = {};

  const response = await fetch("https://aveloquebec.ca/stations/");
  const rewriter = new HTMLRewriter()
    // Getting id and name of the stations.
    .on('ul[id="infoWind"] > li', {
      element(el) {
        id = el.getAttribute("id");
        el.onEndTag(() => {
          let data = {
            id: parseInt(id || ""),
            name: name.trim(),
            bikes: 0,
            free_docks: 0,
          };
          stations[data.id] = data;
          name = "";
        });
      },
    })
    .on('ul[id="infoWind"] > li > div.infoAdd > h5', {
      text(txt: any) {
        name = name + txt.text;
      },
    })
    .on('input[name="arr_adr"][type="hidden"]', {
      element(el) {
        geocoordinatesString = el.getAttribute("value");
      },
    })
    .on('input[id="icon_txt"][type="hidden"]', {
      element(el) {
        availabilityString = el.getAttribute("value");
      },
    });
  await consume(rewriter.transform(response).body!);
  // parse availability
  if (availabilityString != null) {
    let data = JSON.parse(availabilityString);
    for (let key in data) {
      let stationId = parseInt(key);
      let [bikes, free_docks] = data[key].split("/");
      stations[stationId].bikes = parseInt(bikes);
      stations[stationId].free_docks = parseInt(free_docks);
    }
  }
  // parse geocoordinates
  if (geocoordinatesString != null) {
    let data = JSON.parse(geocoordinatesString);
    for (let key in data) {
      let stationId = parseInt(key);
      let [lat, long] = data[key].split("_");
      stations[stationId].lat = Number(lat);
      stations[stationId].long = Number(long);
    }
  }

  return Response.json(Object.values(stations));
}

// ROUTING

const router = AutoRouter();

router.get("/current", () => current());

export default { ...router }; // see note below
