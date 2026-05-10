function resolveContentType(relativePath) {
	if (relativePath.endsWith('.json')) return 'application/json; charset=utf-8';
	if (relativePath.endsWith('.html')) return 'text/html; charset=utf-8';
	if (relativePath.endsWith('.css')) return 'text/css; charset=utf-8';
	if (relativePath.endsWith('.js')) return 'text/javascript; charset=utf-8';
	if (relativePath.endsWith('.svg')) return 'image/svg+xml';
	if (relativePath.endsWith('.png')) return 'image/png';
	if (relativePath.endsWith('.jpg') || relativePath.endsWith('.jpeg')) return 'image/jpeg';
	if (relativePath.endsWith('.webp')) return 'image/webp';
	if (relativePath.endsWith('.gif')) return 'image/gif';
	if (relativePath.endsWith('.mp4')) return 'video/mp4';
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

		async writeAsset(relativePath, content, contentType) {
			await bucket.put(relativePath, content, {
				httpMetadata: { contentType: contentType ?? resolveContentType(relativePath) },
			});
		},

		async readFile(relativePath) {
			const object = await bucket.get(relativePath);
			if (!object) throw new Error(`File not found in dest: ${relativePath}`);
			return object.text();
		},
	};
}