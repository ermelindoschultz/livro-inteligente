import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRemoteBookMetadataStore } from './lib/book-metadata-store.js';
import { createLocalDest } from './lib/storage/local-dest.js';
import { createR2DestNode } from './lib/storage/r2-dest-node.js';
import { createR2SourceNode } from './lib/storage/r2-source-node.js';
import { processBookIngestion } from './run-book-ingestion.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

function readArgValue(args, flag) {
	const index = args.indexOf(flag);
	return index >= 0 ? args[index + 1] : undefined;
}

function hasFlag(args, flag) {
	return args.includes(flag);
}

async function main() {
	const args = process.argv.slice(2);
	const bookSlug = readArgValue(args, '--book');

	if (!bookSlug) {
		throw new Error('Usage: node src/local.js --book <book-slug> [--out]');
	}

	const cloudflareConfig = {
		accessKeyId: process.env.R2_ACCESS_KEY_ID,
		accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
		apiToken: process.env.CLOUDFLARE_API_TOKEN,
		databaseId: process.env.D1_DATABASE_ID ?? 'f76cc294-17a3-4a91-8ec2-b0a5a6aeb0af',
		secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
	};

	const source = createR2SourceNode({ ...cloudflareConfig, bucketName: 'livro-inteligente-raw' });
	const dest = hasFlag(args, '--out')
		? createLocalDest(path.join(projectRoot, 'out'))
		: createR2DestNode({ ...cloudflareConfig, bucketName: 'livro-inteligente' });
	const bookMetadataStore = createRemoteBookMetadataStore(cloudflareConfig);
	const result = await processBookIngestion(bookSlug, { bookMetadataStore, dest, source });

	console.table(result.chapters);
	console.log(
		`book ingestion completed for ${result.bookSlug}: ${result.chapterCount} chapters -> ${result.outputMode}`
	);
}

main().catch((error) => {
	console.error(error.message);
	process.exitCode = 1;
});