import { extractBookStructureStep } from './steps/extract-book-structure-step.js';
import { enrichMetadataStep } from './steps/enrich-metadata-step.js';
import { persistBookMetadataStep } from './steps/persist-book-metadata-step.js';

const BOOK_STATUS = {
	FAILED: 'FAILED',
	PROCESSING: 'PROCESSING',
	SUCCESS: 'SUCCESS',
};

function createIngestionContext(bookSlug, injectedBookId) {
	return {
		bookSlug,
		chapterSummaries: [],
		injectedBookId,
		metadata: null,
	};
}

export async function processBookIngestion(bookSlug, services) {
	const { bookMetadataStore } = services;
	const injectedBook = await bookMetadataStore.findInjectedBookByFolderName(bookSlug);

	if (!injectedBook) {
		throw new Error(`Injected book record not found for folder_name=${bookSlug}`);
	}

	const context = createIngestionContext(bookSlug, injectedBook.id);
	await bookMetadataStore.updateInjectedBookStatus(context.injectedBookId, BOOK_STATUS.PROCESSING);

	try {
        // Step 1: Extract book structure and save chapter markdown files to dest
		await extractBookStructureStep(context, services);

        // Step 2: Enrich chapter metadata with AI-generated content
		await enrichMetadataStep(context, services);

        // Last Step: Persist extracted metadata
		await persistBookMetadataStep(context, services);

        // Mark ingestion as successful
		await bookMetadataStore.updateInjectedBookStatus(context.injectedBookId, BOOK_STATUS.SUCCESS);

		return {
			bookSlug: context.bookSlug,
			chapterCount: context.metadata.chapters.length,
			chapters: context.chapterSummaries,
			metadata: context.metadata,
			outputMode: services.dest.mode,
		};
	} catch (error) {
		try {
			await bookMetadataStore.updateInjectedBookStatus(context.injectedBookId, BOOK_STATUS.FAILED);
		} catch (statusError) {
			console.error(
				`failed to persist FAILED status for ${bookSlug} (id=${context.injectedBookId}): ${statusError.message}`
			);
		}

		throw error;
	}
}