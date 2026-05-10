function compareKeys(left, right) {
	const leftNumber = Number(left.split(" ")[0]);
    const rightNumber = Number(right.split(" ")[0]);
    
    if(isNaN(rightNumber)) {
        if(isNaN(leftNumber)) {
            return left.localeCompare(right);
        }
        return -1;
    }

    if(isNaN(leftNumber)) {
        return 1;
    }

    return leftNumber - rightNumber;
}

function isHtmlBookFile(key, bookSlug) {
	if (!key.startsWith(`${bookSlug}/`) || !key.endsWith('.html')) {
		return false;
	}

	const relativePath = key.slice(bookSlug.length + 1);
	return relativePath.length > 0 && !relativePath.startsWith('assets/');
}

function hasHiddenSegment(relativePath) {
	return relativePath.split('/').some((segment) => segment.startsWith('.'));
}

export function createR2Source(bucket) {
	return {
		mode: 'r2',

		async listHtmlFiles(bookSlug) {
			const filePaths = [];
			let cursor;

			do {
				const result = await bucket.list({
					cursor,
					prefix: `${bookSlug}/`,
				});

				for (const object of result.objects ?? []) {
					if (isHtmlBookFile(object.key, bookSlug)) {
						filePaths.push(object.key.slice(bookSlug.length + 1));
					}
				}

				cursor = result.truncated ? result.cursor : undefined;
			} while (cursor);

			return filePaths.sort(compareKeys);
		},

		async readHtml(bookSlug, filePath) {
			const object = await bucket.get(`${bookSlug}/${filePath}`);

			if (!object) {
				throw new Error(`Source HTML not found: ${bookSlug}/${filePath}`);
			}

			return object.text();
		},

		async readAsset(bookSlug, filePath) {
			const object = await bucket.get(`${bookSlug}/${filePath}`);

			if (!object) {
				throw new Error(`Source asset not found: ${bookSlug}/${filePath}`);
			}

			return {
				body: await object.arrayBuffer(),
				contentType: object.httpMetadata?.contentType ?? null,
			};
		},

		async listAssetFiles(bookSlug) {
			const filePaths = [];
			let cursor;

			do {
				const result = await bucket.list({
					cursor,
					prefix: `${bookSlug}/assets/`,
				});

				for (const object of result.objects ?? []) {
					if (!object.key) {
						continue;
					}

					const relativePath = object.key.slice(bookSlug.length + 1);

					if (!relativePath || relativePath.endsWith('/') || hasHiddenSegment(relativePath)) {
						continue;
					}

					filePaths.push(relativePath);
				}

				cursor = result.truncated ? result.cursor : undefined;
			} while (cursor);

			return filePaths.sort(compareKeys);
		},
	};
}