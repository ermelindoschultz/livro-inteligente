import { BooksRepository } from './books.repository.js';

const parseAuthors = (authors) => {
	if (!authors) {
		return [];
	}

	try {
		const parsed = JSON.parse(authors);
		return Array.isArray(parsed) ? parsed : [];
	} catch {
		return [];
	}
};

const normalizeBaseUrl = (baseUrl) => {
	if (!baseUrl) {
		return null;
	}

	return baseUrl.replace(/\/+$/, '');
};

const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;

const normalizeString = (value) => (typeof value === 'string' ? value.trim() : value);

const validateAuthors = (authors) => {
	return Array.isArray(authors) && authors.length > 0 && authors.every((author) => isNonEmptyString(author));
};

const buildAuthorsJson = (authors) => JSON.stringify(authors.map((author) => author.trim()));

export class BooksService {
	constructor(db, options = {}) {
		this.repository = new BooksRepository(db);
		this.publicBaseUrl = normalizeBaseUrl(options.publicBaseUrl);
	}

	async listAvailableBooks() {
		const books = await this.repository.findAllAvailable();
		return books.map((book) => this.serializeBook(book));
	}

	async getBookMetadataById(id) {
		const book = await this.repository.findById(id);
		if (!book || book.status !== 'SUCCESS') {
			return null;
		}

		return this.serializeBook(book);
	}

	async createBookMetadata(payload) {
		const normalizedPayload = this.validateCreatePayload(payload);
		const injectedBook = await this.repository.findInjectedBookById(normalizedPayload.bookId);

		if (!injectedBook) {
			return { error: 'Injected book not found', status: 404 };
		}

		const existingBook = await this.repository.findById(normalizedPayload.bookId);
		if (existingBook) {
			return { error: 'Book metadata already exists', status: 409 };
		}

		const createdBook = await this.repository.createMetadata(normalizedPayload);
		return { data: this.serializeBook(createdBook), status: 201 };
	}

	async updateBookMetadataById(id, payload) {
		const existingBook = await this.repository.findById(id);
		if (!existingBook) {
			return { error: 'Book not found', status: 404 };
		}

		const normalizedPayload = this.validateUpdatePayload(payload);
		const updatedBook = await this.repository.updateMetadata(id, normalizedPayload);

		return { data: this.serializeBook(updatedBook), status: 200 };
	}

	validateCreatePayload(payload) {
		if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
			throw new Error('Invalid request body');
		}

		if (!Number.isInteger(payload.bookId) || payload.bookId <= 0) {
			throw new Error('bookId must be a positive integer');
		}

		if (!isNonEmptyString(payload.title)) {
			throw new Error('title is required');
		}

		if (!validateAuthors(payload.authors)) {
			throw new Error('authors must be a non-empty array of strings');
		}

		if (!isNonEmptyString(payload.r2FolderPath)) {
			throw new Error('r2FolderPath is required');
		}

		return {
			bookId: payload.bookId,
			title: normalizeString(payload.title),
			description: isNonEmptyString(payload.description) ? normalizeString(payload.description) : null,
			authors: buildAuthorsJson(payload.authors),
			r2FolderPath: normalizeString(payload.r2FolderPath),
			publishedAt: isNonEmptyString(payload.publishedAt) ? normalizeString(payload.publishedAt) : null,
		};
	}

	validateUpdatePayload(payload) {
		if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
			throw new Error('Invalid request body');
		}

		const normalizedPayload = {};

		if (Object.prototype.hasOwnProperty.call(payload, 'title')) {
			if (!isNonEmptyString(payload.title)) {
				throw new Error('title must be a non-empty string');
			}

			normalizedPayload.title = normalizeString(payload.title);
		}

		if (Object.prototype.hasOwnProperty.call(payload, 'description')) {
			if (payload.description !== null && typeof payload.description !== 'string') {
				throw new Error('description must be a string or null');
			}

			normalizedPayload.description = payload.description === null ? null : normalizeString(payload.description);
		}

		if (Object.prototype.hasOwnProperty.call(payload, 'authors')) {
			if (!validateAuthors(payload.authors)) {
				throw new Error('authors must be a non-empty array of strings');
			}

			normalizedPayload.authors = buildAuthorsJson(payload.authors);
		}

		if (Object.prototype.hasOwnProperty.call(payload, 'r2FolderPath')) {
			if (!isNonEmptyString(payload.r2FolderPath)) {
				throw new Error('r2FolderPath must be a non-empty string');
			}

			normalizedPayload.r2FolderPath = normalizeString(payload.r2FolderPath);
		}

		if (Object.prototype.hasOwnProperty.call(payload, 'publishedAt')) {
			if (payload.publishedAt !== null && typeof payload.publishedAt !== 'string') {
				throw new Error('publishedAt must be a string or null');
			}

			normalizedPayload.publishedAt = payload.publishedAt === null ? null : normalizeString(payload.publishedAt);
		}

		if (Object.keys(normalizedPayload).length === 0) {
			throw new Error('At least one field must be provided');
		}

		return normalizedPayload;
	}

	serializeBook(book) {
		const publicUrl = this.publicBaseUrl ? `${this.publicBaseUrl}/${String(book.r2_folder_path).replace(/^\/+/, '')}` : null;

		return {
			id: book.id,
			folderName: book.folder_name,
			status: book.status,
			title: book.title,
			description: book.description,
			authors: parseAuthors(book.authors),
			r2FolderPath: book.r2_folder_path,
			publishedAt: book.published_at,
			publicUrl,
		};
	}
}