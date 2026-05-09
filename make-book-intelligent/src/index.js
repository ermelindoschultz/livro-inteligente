import { createD1BookMetadataStore } from './lib/book-metadata-store.js';
import { createR2Dest } from './lib/storage/r2-dest.js';
import { createR2Source } from './lib/storage/r2-source.js';
import { processBookIngestion } from './run-book-ingestion.js';

export default {
	async queue(batch, env) {
		for (const message of batch.messages) {
			const bookSlug = message.body?.folder_name;

			if (!bookSlug) {
				console.error(`message ${message.id} missing folder_name: ${JSON.stringify(message.body)}`);
				message.ack();
				continue;
			}

			try {
				const source = createR2Source(env.BOOKS_BUCKET);
				const dest = createR2Dest(env.PROCESSED_BUCKET);
				const bookMetadataStore = createD1BookMetadataStore(env.DB);
				const ai = env.AI;
				const result = await processBookIngestion(bookSlug, { ai, bookMetadataStore, dest, source });

				console.log(
					`book ingestion completed for ${bookSlug}: ${result.chapterCount} chapters -> ${result.outputMode}`
				);
			} catch (error) {
				console.error(`book ingestion failed for ${bookSlug}: ${error.message}`);
			}

			message.ack();
		}
	},
};
