import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { createR2NodeClient } from './r2-node-client.js';

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

export function createR2DestNode(config) {
	const client = createR2NodeClient(config);
	const bucketName = config.bucketName;

	if (!bucketName) {
		throw new Error('Missing destination bucket name for R2 destination client.');
	}

	return {
		mode: 'r2-node',

		async writeFile(relativePath, content) {
			await client.send(
				new PutObjectCommand({
					Bucket: bucketName,
					Key: relativePath,
					Body: content,
					ContentType: resolveContentType(relativePath),
				})
			);
		},

		async writeAsset(relativePath, content, contentType) {
			await client.send(
				new PutObjectCommand({
					Bucket: bucketName,
					Key: relativePath,
					Body: content,
					ContentType: contentType ?? resolveContentType(relativePath),
				})
			);
		},

		async readFile(relativePath) {
			const result = await client.send(
				new GetObjectCommand({ Bucket: bucketName, Key: relativePath })
			);
			return result.Body.transformToString();
		},
	};
}