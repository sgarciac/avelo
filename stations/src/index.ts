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
  let stations: {
    id: number;
    bikes: number;
    free_docks: number;
    name: string;
    lat?: number;
    long?: number;
  }[] = [];
  const response = await fetch("https://aveloquebec.ca/stations/");
  // instead of all of this, we could instead use '<input type='hidden' id='icon_txt' value=....', that seems to contain the JSON data
  // for availability
  const rewriter = new HTMLRewriter()
    .on('ul[id="infoWind"] > li', {
      element(el) {
        id = el.getAttribute("id");
        el.onEndTag(() => {
          stations.push({
            id: parseInt(id || ""),
            name: name.trim(),
            bikes: 0,
            free_docks: 0,
          });
          name = "";
        });
      },
    })
    .on('ul[id="infoWind"] > li > div.infoAdd > h5', {
      text(txt: any) {
        name = name + txt.text;
      },
    })
    .on('input[name="arr_adr"]', {
      element(el) {
        geocoordinatesString = el.getAttribute("value");
      },
    });
  await consume(rewriter.transform(response).body!);

  return Response.json(stations);
}

// ROUTING

const router = AutoRouter();

router.get("/current", () => current());

export default { ...router }; // see note below
