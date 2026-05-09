import { select, selectAll } from 'hast-util-select';
import { toString } from 'hast-util-to-string';
import rehypeParse from 'rehype-parse';
import rehypeRemark from 'rehype-remark';
import remarkGfm from 'remark-gfm';
import remarkStringify from 'remark-stringify';
import { unified } from 'unified';
import { visit } from 'unist-util-visit';

function classNames(node) {
	const className = node?.properties?.className;

	if (Array.isArray(className)) {
		return className;
	}

	if (typeof className === 'string') {
		return className.split(/\s+/).filter(Boolean);
	}

	return [];
}

function hasClass(node, expected) {
	return classNames(node).includes(expected);
}

function normalizeText(value) {
	return value.replace(/\s+/g, ' ').trim();
}

function decodeBase64(value) {
	if (!value) {
		return '';
	}

	if (typeof Buffer !== 'undefined') {
		return Buffer.from(value, 'base64').toString('utf8');
	}

	return atob(value);
}

function createTextNode(value) {
	return { type: 'text', value };
}

function createElement(tagName, children = [], properties = {}) {
	return { type: 'element', tagName, properties, children };
}

function replaceChild(parent, index, nodes) {
	parent.children.splice(index, 1, ...nodes);
	return index + nodes.length;
}

function rehypeExtractContent() {
	return (tree, file) => {
		const titleNode = select('h1.header, h1.headersecao', tree);
		const contentNode = select('div.content', tree);

		file.data.title = titleNode ? normalizeText(toString(titleNode)) : '';

		if (!contentNode) {
			throw new Error('Could not locate div.content in source HTML.');
		}

		const bodyNode = select('body', tree);
		const children = [];

		if (file.data.title) {
			children.push(createElement('h1', [createTextNode(file.data.title)]));
		}

		children.push(...contentNode.children);
		bodyNode.children = children;
	};
}

function rehypeDecodeVideos() {
	return (tree, file) => {
		const videos = [];

		visit(tree, 'element', (node) => {
			if (node.tagName !== 'button' || !hasClass(node, 'button-inject-iframe')) {
				return;
			}

			const encodedSource = node.properties?.dataSrc ?? node.properties?.['data-src'];
			videos.push({
				label: normalizeText(toString(node)) || 'Assista ao vídeo',
				r2_key: decodeBase64(String(encodedSource ?? '')),
			});
		});

		file.data.videos = videos.filter((video) => video.r2_key);
	};
}

function buildBlockquoteFromMessage(node) {
	const headerNode = select('.message-header', node);
	const bodyNode = select('.message-body', node);
	const label = headerNode ? normalizeText(toString(headerNode)) : 'Nota';
	const bodyChildren = bodyNode?.children?.length ? bodyNode.children : [createElement('p', [createTextNode(normalizeText(toString(node)))])];

	return createElement('blockquote', [
		createElement('p', [createElement('strong', [createTextNode(`[${label}]`)])]),
		...bodyChildren,
	]);
}

function buildActivityNodes(node) {
	const heading = normalizeText(toString(select('.header-atv span:last-child', node) ?? node));
	const question = normalizeText(
		toString(select('.boxpadraoatv > div > div:not(.resposta) p', node) ?? select('.boxpadraoatv p', node) ?? node)
	);
	const answerParagraphs = selectAll('.resposta p', node)
		.map((paragraph) => normalizeText(toString(paragraph)))
		.filter(Boolean)
		.map((text) => createElement('p', [createTextNode(text)]));

	return [
		createElement('h3', [createTextNode(heading || 'Atividade')]),
		createElement('p', [createElement('strong', [createTextNode('Q:')]), createTextNode(` ${question}`)]),
		createElement('blockquote', answerParagraphs.length ? answerParagraphs : [createElement('p', [createTextNode('Resposta não encontrada.')])]),
	];
}

function normalizeFigure(node) {
	const imageNode = select('img', node);
	const captionNode = select('figcaption', node);
	const creditNode = select('p.credito', node);
	const nextChildren = [];

	if (imageNode) {
		nextChildren.push(createElement('p', [imageNode]));
	}

	if (captionNode) {
		nextChildren.push(createElement('p', [createTextNode(normalizeText(toString(captionNode)))]));
	}

	if (creditNode) {
		nextChildren.push(
			createElement('p', [createElement('em', [createTextNode(`Crédito: ${normalizeText(toString(creditNode))}`)])])
		);
	}

	return nextChildren.length ? nextChildren : [createElement('p', [createTextNode(normalizeText(toString(node)))])];
}

function flattenTable(tableNode) {
	const rows = selectAll('tr', tableNode);
	const matrix = [];
	const spans = [];

	for (const row of rows) {
		const nextRow = [];
		let columnIndex = 0;
		const cells = (row.children ?? []).filter(
			(child) => child.type === 'element' && (child.tagName === 'th' || child.tagName === 'td')
		);

		const consumeSpans = () => {
			while (spans[columnIndex]?.remaining > 0) {
				nextRow[columnIndex] = spans[columnIndex].text;
				spans[columnIndex].remaining -= 1;
				if (spans[columnIndex].remaining === 0) {
					spans[columnIndex] = undefined;
				}
				columnIndex += 1;
			}
		};

		for (const cell of cells) {
			consumeSpans();
			const text = normalizeText(toString(cell));
			const rowSpan = Number(cell.properties?.rowSpan ?? cell.properties?.rowspan ?? 1);
			const colSpan = Number(cell.properties?.colSpan ?? cell.properties?.colspan ?? 1);

			for (let offset = 0; offset < colSpan; offset += 1) {
				nextRow[columnIndex + offset] = text;
				if (rowSpan > 1) {
					spans[columnIndex + offset] = { remaining: rowSpan - 1, text };
				}
			}

			columnIndex += colSpan;
		}

		consumeSpans();
		matrix.push(nextRow);
	}

	const totalColumns = matrix.reduce((max, row) => Math.max(max, row.length), 0);
	for (const row of matrix) {
		while (row.length < totalColumns) {
			row.push('');
		}
	}

	const headerCells = matrix[0] ?? [];
	const bodyRows = matrix.slice(1);

	return createElement('table', [
		createElement('thead', [
			createElement('tr', headerCells.map((cell) => createElement('th', [createTextNode(cell)]))),
		]),
		createElement(
			'tbody',
			bodyRows.map((row) => createElement('tr', row.map((cell) => createElement('td', [createTextNode(cell)]))))
		),
	]);
}

function rehypeNormalizeBookHtml() {
	return (tree) => {
		visit(tree, 'element', (node, index, parent) => {
			if (!parent || typeof index !== 'number') {
				return;
			}

			if (node.tagName === 'button' && hasClass(node, 'button-inject-iframe')) {
				parent.children.splice(index, 1);
				return index;
			}

			if (node.tagName === 'article' && hasClass(node, 'message')) {
				return replaceChild(parent, index, [buildBlockquoteFromMessage(node)]);
			}

			if (node.tagName === 'div' && hasClass(node, 'header-atv-back')) {
				return replaceChild(parent, index, buildActivityNodes(node));
			}

			if (node.tagName === 'div' && hasClass(node, 'boxpadrao')) {
				node.tagName = 'blockquote';
				node.properties = {};
				return;
			}

			if (node.tagName === 'div' && hasClass(node, 'notification')) {
				node.tagName = 'blockquote';
				node.properties = {};
				return;
			}

			if (node.tagName === 'figure') {
				return replaceChild(parent, index, normalizeFigure(node));
			}

			if (node.tagName === 'table') {
				return replaceChild(parent, index, [flattenTable(node)]);
			}

			if (node.tagName === 'div' && (hasClass(node, 'modal') || hasClass(node, 'linha-horizontal') || hasClass(node, 'faixa'))) {
				parent.children.splice(index, 1);
				return index;
			}

			if (node.tagName === 'i') {
				parent.children.splice(index, 1);
				return index;
			}

			if (node.tagName === 'figcaption') {
				node.tagName = 'p';
				node.properties = {};
			}
		});
	};
}

export async function convertHtmlToMarkdown(html) {
	const file = await unified()
		.use(rehypeParse)
		.use(rehypeExtractContent)
		.use(rehypeDecodeVideos)
		.use(rehypeNormalizeBookHtml)
		.use(rehypeRemark)
		.use(remarkGfm)
		.use(remarkStringify, {
			bullet: '-',
			emphasis: '*',
			fences: true,
			listItemIndent: 'one',
			strong: '*',
		})
		.process(html);

	return {
		markdown: String(file).trim() + '\n',
		title: String(file.data.title ?? '').trim(),
		videos: Array.isArray(file.data.videos) ? file.data.videos : [],
	};
}