const SECTION_ACTIVITY_PATTERN = /^(\d+)\.(\d+)\s+(.+)\.html$/i;
const CHAPTER_PATTERN = /^(\d+)\.\s+(.+)\.html$/i;

function normalizeWhitespace(value) {
	return value.replace(/\s+/g, ' ').trim();
}

function slugFragment(value) {
	return normalizeWhitespace(value)
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
}

function formatOrderLabel(orderParts) {
	return orderParts.join('.');
}

export function parseFilename(filePath) {
	const filename = filePath.split('/').pop() ?? filePath;
	const normalized = normalizeWhitespace(filename);

	if (/^0\./i.test(normalized)) {
		const title = normalizeWhitespace(normalized.replace(/^0\.\s*/i, '').replace(/\.html$/i, ''));
		return {
			file_path: filePath,
			id: 'ch-0',
			order: [0],
			order_label: '0',
			parent_id: null,
			type: 'preface',
			title,
			slug: 'preface',
		};
	}

	if (/^Minicurriculo\.html$/i.test(normalized)) {
		return {
			file_path: filePath,
			id: 'ch-about',
			order: [9999],
			order_label: 'Minicurriculo',
			parent_id: null,
			type: 'about',
			title: 'Minicurriculo',
			slug: 'about',
		};
	}

	if (/Anexo/i.test(normalized)) {
		const chapterMatch = normalized.match(/^(\d+)\./);
		const chapterNumber = chapterMatch ? Number(chapterMatch[1]) : 9998;
		const title = normalizeWhitespace(normalized.replace(/\.html$/i, ''));
		return {
			file_path: filePath,
			id: `ch-${chapterNumber}`,
			order: [chapterNumber],
			order_label: String(chapterNumber),
			parent_id: null,
			type: 'annex',
			title,
			slug: 'annex',
		};
	}

	const sectionMatch = normalized.match(SECTION_ACTIVITY_PATTERN);

	if (sectionMatch) {
		const chapterNumber = Number(sectionMatch[1]);
		const sectionNumber = Number(sectionMatch[2]);
		const title = normalizeWhitespace(sectionMatch[3]);
		const type = /^Atividades/i.test(title) ? 'activities' : 'section';

		return {
			file_path: filePath,
			id: `ch-${chapterNumber}-${sectionNumber}`,
			order: [chapterNumber, sectionNumber],
			order_label: formatOrderLabel([chapterNumber, sectionNumber]),
			parent_id: `ch-${chapterNumber}`,
			type,
			title,
			slug: slugFragment(title),
		};
	}

	const chapterMatch = normalized.match(CHAPTER_PATTERN);

	if (chapterMatch) {
		const chapterNumber = Number(chapterMatch[1]);
		const title = normalizeWhitespace(chapterMatch[2]);

		return {
			file_path: filePath,
			id: `ch-${chapterNumber}`,
			order: [chapterNumber],
			order_label: String(chapterNumber),
			parent_id: null,
			type: 'chapter',
			title,
			slug: slugFragment(title),
		};
	}

	throw new Error(`Unsupported book file naming pattern: ${filePath}`);
}

function compareOrder(left, right) {
	const minLength = Math.min(left.order.length, right.order.length);

	for (let index = 0; index < minLength; index += 1) {
		if (left.order[index] !== right.order[index]) {
			return left.order[index] - right.order[index];
		}
	}

	if (left.order.length !== right.order.length) {
		return left.order.length - right.order.length;
	}

	return left.file_path.localeCompare(right.file_path, 'pt-BR', { numeric: true, sensitivity: 'base' });
}

export function buildMetadata(bookSlug, descriptors) {
	const orderedDescriptors = [...descriptors].sort(compareOrder);
	const createdAt = new Date().toISOString();
	const chapters = orderedDescriptors
		.map((descriptor, index) => ({
			book_id: bookSlug,
			file_path: descriptor.file_path,
			id: descriptor.id,
			markdown_path: `ai/${descriptor.id}.md`,
			order: descriptor.order_label,
			order_parts: [...descriptor.order],
			position: index,
			parent_id: descriptor.parent_id,
			slug: descriptor.slug,
			title: descriptor.title,
			type: descriptor.type,
			videos: [],
		}));

	for (let index = 0; index < chapters.length; index += 1) {
		const previous = chapters[index - 1] ?? null;
		const current = chapters[index];
		const next = chapters[index + 1] ?? null;

		current.previous_chapter_id = previous?.id ?? null;
		current.previous_chapter_order = previous?.order ?? null;
		current.previous_chapter_title = previous?.title ?? null;
		current.previous_chapter_path = previous?.file_path ?? null;
		current.next_chapter_id = next?.id ?? null;
		current.next_chapter_order = next?.order ?? null;
		current.next_chapter_title = next?.title ?? null;
		current.next_chapter_path = next?.file_path ?? null;
	}

	const chapterMap = new Map(chapters.map((chapter) => [chapter.id, chapter]));
	const navigationTree = [];
	const nodeMap = new Map();

	for (const chapter of chapters) {
		nodeMap.set(chapter.id, {
			children: [],
			file_path: chapter.file_path,
			id: chapter.id,
			label: chapter.title,
			markdown_path: chapter.markdown_path,
			next_chapter_id: chapter.next_chapter_id,
			next_chapter_order: chapter.next_chapter_order,
			next_chapter_title: chapter.next_chapter_title,
			order: chapter.order,
			order_parts: chapter.order_parts,
			position: chapter.position,
			previous_chapter_id: chapter.previous_chapter_id,
			previous_chapter_order: chapter.previous_chapter_order,
			previous_chapter_title: chapter.previous_chapter_title,
			type: chapter.type,
		});
	}

	for (const chapter of chapters) {
		const node = nodeMap.get(chapter.id);
		const parent = chapter.parent_id ? chapterMap.get(chapter.parent_id) : null;

		if (parent) {
			nodeMap.get(parent.id).children.push(node);
		} else {
			navigationTree.push(node);
		}
	}

	return {
		book_id: bookSlug,
		slug: bookSlug,
		title: null,
		description: null,
		authors: [],
		r2_folder_path: `${bookSlug}/`,
		published_at: null,
		created_at: createdAt,
		updated_at: createdAt,
		chapters,
		navigation_tree: navigationTree,
		pipeline: {
			current_step: 'extractBookStructureStep',
			steps: ['extractBookStructureStep', 'persistBookMetadataStep'],
		},
	};
}