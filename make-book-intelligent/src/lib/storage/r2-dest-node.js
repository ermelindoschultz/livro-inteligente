import { PutObjectCommand } from '@aws-sdk/client-s3';
import { createR2NodeClient } from './r2-node-client.js';

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
					ContentType: relativePath.endsWith('.json')
						? 'application/json; charset=utf-8'
						: 'text/markdown; charset=utf-8',
				})
			);
		},
	};
}