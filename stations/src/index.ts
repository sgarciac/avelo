async function consume(stream: ReadableStream) {
  const reader = stream.getReader();
  while (!(await reader.read()).done) {}
}

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    let id: string | null = "";
    let name: string = "";
    let free_docks: string = "";
    let bikes: string = "";
    let stations: {
      id: number;
      bikes: number;
      free_docks: number;
      name: string;
    }[] = [];
    const response = await fetch("https://aveloquebec.ca/stations/");
    const rewriter = new HTMLRewriter()
      .on('ul[id="infoWind"] > li', {
        element(el) {
          id = el.getAttribute("id");
          el.onEndTag(() => {
            stations.push({
              id: parseInt(id || ""),
              name: name.trim(),
              free_docks: parseInt(free_docks.trim()),
              bikes: parseInt(bikes.trim()),
            });
            name = "";
            free_docks = "";
            bikes = "";
          });
        },
      })
      .on('ul[id="infoWind"] > li > div.infoAdd > h5', {
        text(txt) {
          name = name + txt.text;
        },
      })
      .on(
        'ul[id="infoWind"] > li > div.availability > div.infotxt:nth-child(1) > strong',
        {
          text(txt) {
            bikes = bikes + txt.text;
          },
        }
      )
      .on(
        'ul[id="infoWind"] > li > div.availability > div.infotxt:nth-child(2) > strong',
        {
          text(txt) {
            free_docks = free_docks + txt.text;
          },
        }
      );
    await consume(rewriter.transform(response).body!);
    return Response.json(stations);
  },
};
