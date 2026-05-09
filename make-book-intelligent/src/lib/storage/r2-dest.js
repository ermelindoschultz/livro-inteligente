export function createR2Dest(bucket) {
	return {
		mode: 'r2',

		async writeFile(relativePath, content) {
			await bucket.put(relativePath, content, {
				httpMetadata: {
					contentType: relativePath.endsWith('.json')
						? 'application/json; charset=utf-8'
						: 'text/markdown; charset=utf-8',
				},
			});
		},
	};
}