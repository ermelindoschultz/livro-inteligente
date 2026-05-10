import { generateUniqueTrivia } from './trivia-generator.js';

const MAX_MARKDOWN_LENGTH = 12_000;
const MARKDOWN_TIMEOUT_MS = 8_000;

function isAllowedMarkdownUrl(value) {
	if (typeof value !== 'string' || value.trim().length === 0) {
		return false;
	}

	try {
		const parsed = new URL(value);
		return parsed.protocol === 'https:' || parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';
	} catch {
		return false;
	}
}

async function fetchMarkdown(markdownUrl) {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), MARKDOWN_TIMEOUT_MS);

	try {
		const response = await fetch(markdownUrl, {
			cache: 'no-store',
			signal: controller.signal,
		});

		if (!response.ok) {
			throw new Error(`Nao foi possivel baixar o markdown remoto (${response.status}).`);
		}

		const markdown = await response.text();
		return markdown.slice(0, MAX_MARKDOWN_LENGTH);
	} finally {
		clearTimeout(timeout);
	}
}

function parseBody(body) {
	if (!body || typeof body !== 'object' || Array.isArray(body)) {
		throw new Error('Invalid request body');
	}

	if (!isAllowedMarkdownUrl(body.markdownUrl)) {
		throw new Error('markdownUrl precisa ser uma URL http(s) valida e publica.');
	}

	if (typeof body.pageId !== 'string' || body.pageId.trim().length === 0) {
		throw new Error('pageId is required');
	}

	if (typeof body.chapterId !== 'string' || body.chapterId.trim().length === 0) {
		throw new Error('chapterId is required');
	}

	if (body.existingQuestions != null && !Array.isArray(body.existingQuestions)) {
		throw new Error('existingQuestions must be an array of strings');
	}

	return {
		markdownUrl: body.markdownUrl.trim(),
		pageId: body.pageId.trim(),
		chapterId: body.chapterId.trim(),
		existingQuestions: (body.existingQuestions ?? []).filter((question) => typeof question === 'string' && question.trim().length > 0),
	};
}

export async function generateTriviaHandler(c) {
	if (!c.env.AI) {
		return c.json({ error: 'AI binding is not configured for this environment' }, 500);
	}

	let body;

	try {
		body = parseBody(await c.req.json());
	} catch (error) {
		return c.json({ error: error.message }, 400);
	}

	try {
		const markdown = await fetchMarkdown(body.markdownUrl);
		const trivia = await generateUniqueTrivia(markdown, body.existingQuestions, c.env.AI);

		return c.json({
			data: {
				type: 'trivia',
				chapterId: body.chapterId,
				page_id: body.pageId,
				content: trivia,
			},
		});
	} catch (error) {
		return c.json({ error: error.message }, 422);
	}
}