import { S3Client } from '@aws-sdk/client-s3';

export function createR2NodeClient({ accountId, accessKeyId, secretAccessKey }) {
	if (!accountId || !accessKeyId || !secretAccessKey) {
		throw new Error(
			'Missing R2 credentials. Expected CLOUDFLARE_ACCOUNT_ID, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY.'
		);
	}

	return new S3Client({
		region: 'auto',
		endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
		credentials: {
			accessKeyId,
			secretAccessKey,
		},
	});
}