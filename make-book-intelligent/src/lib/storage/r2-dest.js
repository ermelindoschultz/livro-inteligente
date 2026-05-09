function resolveContentType(relativePath) {
	if (relativePath.endsWith('.json')) return 'application/json; charset=utf-8';
	if (relativePath.endsWith('.html')) return 'text/html; charset=utf-8';
	return 'text/markdown; charset=utf-8';
}

export function createR2Dest(bucket) {
	return {
		mode: 'r2',

		async writeFile(relativePath, content) {
			await bucket.put(relativePath, content, {
				httpMetadata: { contentType: resolveContentType(relativePath) },
			});
		},

		async readFile(relativePath) {
			const object = await bucket.get(relativePath);
			if (!object) throw new Error(`File not found in dest: ${relativePath}`);
			return object.text();
		},
	};
}