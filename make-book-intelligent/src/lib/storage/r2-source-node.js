import { GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { createR2NodeClient } from './r2-node-client.js';

function compareKeys(left, right) {
	return left.localeCompare(right, 'pt-BR', { numeric: true, sensitivity: 'base' });
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

export function createR2SourceNode(config) {
	const client = createR2NodeClient(config);
	const bucketName = config.bucketName;

	if (!bucketName) {
		throw new Error('Missing source bucket name for R2 source client.');
	}

	return {
		mode: 'r2-node',

		async listHtmlFiles(bookSlug) {
			const filePaths = [];
			let continuationToken;

			do {
				const result = await client.send(
					new ListObjectsV2Command({
						Bucket: bucketName,
						ContinuationToken: continuationToken,
						Prefix: `${bookSlug}/`,
					})
				);

				for (const object of result.Contents ?? []) {
					if (object.Key && isHtmlBookFile(object.Key, bookSlug)) {
						filePaths.push(object.Key.slice(bookSlug.length + 1));
					}
				}

				continuationToken = result.IsTruncated ? result.NextContinuationToken : undefined;
			} while (continuationToken);

			return filePaths.sort(compareKeys);
		},

		async readHtml(bookSlug, filePath) {
			const result = await client.send(
				new GetObjectCommand({
					Bucket: bucketName,
					Key: `${bookSlug}/${filePath}`,
				})
			);

			return result.Body.transformToString();
		},

		async readAsset(bookSlug, filePath) {
			const result = await client.send(
				new GetObjectCommand({
					Bucket: bucketName,
					Key: `${bookSlug}/${filePath}`,
				})
			);

			return {
				body: await result.Body.transformToByteArray(),
				contentType: result.ContentType ?? null,
			};
		},

		async listAssetFiles(bookSlug) {
			const filePaths = [];
			let continuationToken;

			do {
				const result = await client.send(
					new ListObjectsV2Command({
						Bucket: bucketName,
						ContinuationToken: continuationToken,
						Prefix: `${bookSlug}/assets/`,
					})
				);

				for (const object of result.Contents ?? []) {
					if (!object.Key) {
						continue;
					}

					const relativePath = object.Key.slice(bookSlug.length + 1);

					if (!relativePath || relativePath.endsWith('/') || hasHiddenSegment(relativePath)) {
						continue;
					}

					filePaths.push(relativePath);
				}

				continuationToken = result.IsTruncated ? result.NextContinuationToken : undefined;
			} while (continuationToken);

			return filePaths.sort(compareKeys);
		},
	};
}