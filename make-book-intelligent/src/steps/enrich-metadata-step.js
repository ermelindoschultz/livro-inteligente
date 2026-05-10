import { generateBossMetadata } from '../lib/enrichment/boss-metadata.js';
import { generateBossTrivia } from '../lib/enrichment/boss-trivia.js';
import { generateTrivia } from '../lib/enrichment/trivia.js';

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

	// Helper: collect ordered pages for a chapter (chapter entry + child sections).
	function pagesOf(mainChapter) {
		return allChapters
			.filter((entry) => entry.id === mainChapter.id || entry.parent_id === mainChapter.id)
			.sort((left, right) => left.position - right.position);
	}

	function clearGeneratedEnrichment(mainChapter) {
		mainChapter.enrichment = (mainChapter.enrichment ?? []).filter(
			(item) => !['what_you_will_learn', 'resume_to_test', 'trivia', 'boss_trivia'].includes(item?.type),
		);
		delete mainChapter.boss;
	}

	function getTrainingPages(pages) {
		const numberedSections = pages.filter(
			(page) =>
				page.type === 'section' &&
				Array.isArray(page.order_parts) &&
				page.order_parts.length > 1 &&
				!/(resumo|conclus[aã]o|sum[aá]rio)/i.test(page.title ?? ''),
		);

		return numberedSections.slice(0, Math.max(numberedSections.length - 1, 0));
	}

	function getBossSourcePages(pages) {
		return pages.filter((page) => !['activities', 'annex', 'about'].includes(page.type));
	}

	// Helper: read all markdowns for a set of pages.
	async function readMarkdowns(pages) {
		const map = {};
		for (const page of pages) {
			map[page.id] = await dest.readFile(`${context.bookSlug}/${page.markdown_path}`);
		}
		return map;
	}

	for (const mainChapter of mainChapters) {
		clearGeneratedEnrichment(mainChapter);

		const pages = pagesOf(mainChapter);
		const trainingPages = getTrainingPages(pages);

		for (const page of trainingPages) {
			const markdown = await dest.readFile(`${context.bookSlug}/${page.markdown_path}`);
			mainChapter.enrichment.push({
				type: 'trivia',
				page_id: page.id,
				content: await generateTrivia(markdown, ai),
			});
		}

		const bossSourcePages = getBossSourcePages(pages);
		const markdownByPageId = await readMarkdowns(bossSourcePages);
		const allContent = Object.values(markdownByPageId).join('\n\n---\n\n');

		mainChapter.boss = await generateBossMetadata(allContent, ai);

		const bossQuestions = await generateBossTrivia(allContent, ai);
		for (const content of bossQuestions.slice(0, 5)) {
			mainChapter.enrichment.push({
				type: 'boss_trivia',
				page_id: mainChapter.id,
				content,
			});
		}

		await saveMetadataSnapshot(context, dest);
	}
}
