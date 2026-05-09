import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { createR2NodeClient } from './r2-node-client.js';

function resolveContentType(relativePath) {
	if (relativePath.endsWith('.json')) return 'application/json; charset=utf-8';
	if (relativePath.endsWith('.html')) return 'text/html; charset=utf-8';
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

		async readFile(relativePath) {
			const result = await client.send(
				new GetObjectCommand({ Bucket: bucketName, Key: relativePath })
			);
			return result.Body.transformToString();
		},
	};
}