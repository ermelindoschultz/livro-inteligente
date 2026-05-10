import { buildMetadata, parseFilename } from '../lib/metadata-builder.js';
import { convertHtmlToMarkdown } from '../lib/html-to-md.js';

function updateNavigationTitles(nodes, chapterMap) {
	for (const node of nodes) {
		const chapter = chapterMap.get(node.id);

		if (chapter) {
			node.label = chapter.title;
			node.next_chapter_id = chapter.next_chapter_id;
			node.next_chapter_order = chapter.next_chapter_order;
			node.next_chapter_title = chapter.next_chapter_title;
			node.previous_chapter_id = chapter.previous_chapter_id;
			node.previous_chapter_order = chapter.previous_chapter_order;
			node.previous_chapter_title = chapter.previous_chapter_title;
		}

		if (node.children?.length) {
			updateNavigationTitles(node.children, chapterMap);
		}
	}
}

function extractDocumentTitle(html) {
	const match = html.match(/<title>([\s\S]*?)<\/title>/i);
	return match ? match[1].replace(/\s+/g, ' ').trim() : null;
}

function extractAuthorsFromMarkdown(markdown) {
	return [...new Set(markdown.split('\n').filter((line) => /^###\s+/.test(line)).map((line) => line.replace(/^###\s+/, '').trim()).filter(Boolean))];
}

function extractDescription(markdown) {
	for (const line of markdown.split('\n').map((entry) => entry.trim())) {
		if (!line || line.startsWith('#') || line.startsWith('![') || line.startsWith('>')) {
			continue;
		}

		return line;
	}

	return null;
}

function resolveBookTitle(context, chapter, details) {
	if (context.metadata.title) {
		return;
	}

	if (details.documentTitle && details.documentTitle !== chapter.title) {
		context.metadata.title = details.documentTitle;
		return;
	}

	if (chapter.type === 'chapter') {
		context.metadata.title = chapter.title;
	}
}

async function saveMetadataSnapshot(context, dest) {
	context.metadata.updated_at = new Date().toISOString();
	await dest.writeFile(`${context.bookSlug}/metadata.json`, JSON.stringify(context.metadata, null, 2));
}

async function copyBookAssets(context, source, dest) {
	const assetPaths = (await source.listAssetFiles?.(context.bookSlug)) ?? [];

	for (const assetPath of assetPaths) {
		const asset = await source.readAsset(context.bookSlug, assetPath);
		await dest.writeAsset(`${context.bookSlug}/${assetPath}`, asset.body, asset.contentType);
	}
}

export async function extractBookStructureStep(context, services) {
	const { dest, source } = services;

	const filePaths = await source.listHtmlFiles(context.bookSlug);
	if (filePaths.length === 0) {
		throw new Error(`No HTML files found for book: ${context.bookSlug}`);
	}

	const descriptors = filePaths.map((filePath) => parseFilename(filePath));
	context.metadata = buildMetadata(context.bookSlug, descriptors);
	context.metadata.pipeline.current_step = 'extractBookStructureStep';
	context.chapterSummaries = [];

	await copyBookAssets(context, source, dest);

	for (const chapter of context.metadata.chapters) {
		const html = await source.readHtml(context.bookSlug, chapter.file_path);
		const { markdown, title, videos } = await convertHtmlToMarkdown(html);
		const documentTitle = extractDocumentTitle(html);

		await dest.writeFile(`${context.bookSlug}/${chapter.file_path}`, html);

		if (title) {
			chapter.title = title;
		}

		chapter.videos = videos;
		resolveBookTitle(context, chapter, { documentTitle });

		if (!context.metadata.description && chapter.type === 'preface') {
			context.metadata.description = extractDescription(markdown);
		}

		if (chapter.type === 'about') {
			const authors = extractAuthorsFromMarkdown(markdown);
			if (authors.length > 0) {
				context.metadata.authors = authors;
			}
		}

		await dest.writeFile(`${context.bookSlug}/${chapter.markdown_path}`, markdown);
		context.chapterSummaries.push({
			bytes: new TextEncoder().encode(markdown).byteLength,
			id: chapter.id,
			title: chapter.title,
			type: chapter.type,
		});

		updateNavigationTitles(
			context.metadata.navigation_tree,
			new Map(context.metadata.chapters.map((entry) => [entry.id, entry]))
		);
		await saveMetadataSnapshot(context, dest);
	}

	if (!context.metadata.title) {
		context.metadata.title =
			context.metadata.chapters.find((chapter) => chapter.type === 'chapter')?.title ?? context.bookSlug;
	}

	if (!context.metadata.authors.length) {
		context.metadata.authors = ['Equipe Livro Inteligente'];
	}
}