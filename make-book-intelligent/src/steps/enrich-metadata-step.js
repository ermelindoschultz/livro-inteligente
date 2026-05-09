import { generateWhatYouWillLearn } from '../lib/enrichment/what-you-will-learn.js';
import { generateTrivia } from '../lib/enrichment/trivia.js';
import { generateResumeToTest } from '../lib/enrichment/resume-to-test.js';

/**
 * Stack-based random page selector.
 *
 * Iterates through the pool in random order. For each candidate, flips a
 * coin (yes/no). If the pool would be exhausted before reaching `count`
 * selections, remaining candidates are taken automatically so the target
 * count is always met when enough pages are available.
 */
function selectTriviaPages(middlePages, count = 2) {
	const pool = [...middlePages];
	const selected = [];

	while (pool.length > 0 && selected.length < count) {
		const needed = count - selected.length;

		// If remaining pages equal what we still need, take them all.
		if (pool.length === needed) {
			selected.push(...pool.splice(0));
			break;
		}

		// Pop a random candidate from the pool.
		const index = Math.floor(Math.random() * pool.length);
		const [candidate] = pool.splice(index, 1);

		// Yes or no.
		if (Math.random() < 0.5) {
			selected.push(candidate);
		}
	}

	return selected;
}

async function saveMetadataSnapshot(context, dest) {
	context.metadata.updated_at = new Date().toISOString();
	await dest.writeFile(`${context.bookSlug}/metadata.json`, JSON.stringify(context.metadata, null, 2));
}

export async function enrichMetadataStep(context, services) {
	const { ai, dest } = services;
	context.metadata.pipeline.current_step = 'enrichMetadataStep';

	const allChapters = context.metadata.chapters;

	// Ordered list of main chapters across the whole book.
	const mainChapters = allChapters
		.filter((chapter) => chapter.type === 'chapter')
		.sort((left, right) => left.position - right.position);

	if (mainChapters.length === 0) return;

	const firstChapter = mainChapters[0];
	const lastChapter = mainChapters[mainChapters.length - 1];

	// Helper: collect ordered pages for a chapter (chapter entry + child sections).
	function pagesOf(mainChapter) {
		return allChapters
			.filter((entry) => entry.id === mainChapter.id || entry.parent_id === mainChapter.id)
			.sort((left, right) => left.position - right.position);
	}

	// Helper: read all markdowns for a set of pages.
	async function readMarkdowns(pages) {
		const map = {};
		for (const page of pages) {
			map[page.id] = await dest.readFile(`${context.bookSlug}/${page.markdown_path}`);
		}
		return map;
	}

	// --- Fixed (1): "What you will learn" on the first page of the first chapter ---
	{
		const pages = pagesOf(firstChapter);
		if (pages.length > 0) {
			const markdownByPageId = await readMarkdowns(pages);
			const allContent = Object.values(markdownByPageId).join('\n\n---\n\n');

			firstChapter.enrichment = firstChapter.enrichment ?? [];
			firstChapter.enrichment.push({
				type: 'what_you_will_learn',
				page_id: pages[0].id,
				content: await generateWhatYouWillLearn(allContent, ai),
			});

			await saveMetadataSnapshot(context, dest);
		}
	}

	// --- Random (2 + 3): Two trivias across middle pages of non-first chapters ---
	{
		// Build the pool of all eligible middle pages from non-first chapters.
		const triviaPool = [];
		for (const mainChapter of mainChapters.slice(1)) {
			const pages = pagesOf(mainChapter);
			const middlePages = pages.slice(1, pages.length - 1);
			for (const page of middlePages) {
				triviaPool.push({ chapter: mainChapter, page });
			}
		}

		const triviaTargets = selectTriviaPages(triviaPool, 2);

		for (const { chapter, page } of triviaTargets) {
			const markdown = await dest.readFile(`${context.bookSlug}/${page.markdown_path}`);
			chapter.enrichment = chapter.enrichment ?? [];
			chapter.enrichment.push({
				type: 'trivia',
				page_id: page.id,
				content: await generateTrivia(markdown, ai),
			});
		}

		await saveMetadataSnapshot(context, dest);
	}

	// --- Fixed (4): "Resume to test" on the last page of the last chapter ---
	{
		const pages = pagesOf(lastChapter);
		if (pages.length > 0) {
			const markdownByPageId = await readMarkdowns(pages);
			const allContent = Object.values(markdownByPageId).join('\n\n---\n\n');

			lastChapter.enrichment = lastChapter.enrichment ?? [];
			lastChapter.enrichment.push({
				type: 'resume_to_test',
				page_id: pages[pages.length - 1].id,
				content: await generateResumeToTest(allContent, ai),
			});

			await saveMetadataSnapshot(context, dest);
		}
	}
}
