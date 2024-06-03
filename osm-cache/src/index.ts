// proxy/cache https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url);
		const subdomain = url.hostname.split('.')[0];
		const pathname = url.pathname;
		const key = 'osm-cache/' + pathname;
		const head = await env.OSM_CACHE.head(key);
		if (head == null) {
			const originUrl = `https://${subdomain}.tile-cyclosm.openstreetmap.fr/cyclosm${pathname}`;
			console.log('cache-miss, fetching ' + originUrl);
			const original = await fetch(originUrl);
			if (!original.ok) {
				return new Response('Failed to fetch', { status: original.status });
			}

			const uploadResult = await env.OSM_CACHE.put(key, original.body);
			if (uploadResult == null) {
				return new Response('Failed to upload', { status: 500 });
			} else {
				console.log('upload success');
			}
		} else {
			console.log('cache-hit');
		}
		const object = await env.OSM_CACHE.get(key);
		if (object === null) {
			// this should not happen
			console.log('Object Not Found');
			return new Response('Object Not Found', { status: 404 });
		}
		const headers = new Headers();
		object.writeHttpMetadata(headers);
		headers.set('etag', object.httpEtag);
		return new Response(object.body, {
			headers,
		});
	},
};
