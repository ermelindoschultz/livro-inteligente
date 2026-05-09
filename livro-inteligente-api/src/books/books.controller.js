import { BooksService } from './books.service.js';

export class BooksController {
	getService(env) {
		return new BooksService(env.DB, {
			publicBaseUrl: env.R2_PUBLIC_BASE_URL,
		});
	}

	async parseJsonBody(c) {
		try {
			return await c.req.json();
		} catch {
			return null;
		}
	}

	async list(c) {
		const service = this.getService(c.env);
		const books = await service.listAvailableBooks();

		return c.json({
			data: books,
		});
	}

	async getById(c) {
		const id = Number(c.req.param('id'));

		if (!Number.isInteger(id) || id <= 0) {
			return c.json({ error: 'Invalid book id' }, 400);
		}

		const service = this.getService(c.env);
		const book = await service.getBookMetadataById(id);

		if (!book) {
			return c.json({ error: 'Book not found' }, 404);
		}

		return c.json({
			data: book,
		});
	}

	async create(c) {
		const body = await this.parseJsonBody(c);
		const service = this.getService(c.env);

		try {
			const result = await service.createBookMetadata(body);

			if (result.error) {
				return c.json({ error: result.error }, result.status);
			}

			return c.json({ data: result.data }, result.status);
		} catch (error) {
			return c.json({ error: error.message }, 400);
		}
	}

	async patch(c) {
		const id = Number(c.req.param('id'));

		if (!Number.isInteger(id) || id <= 0) {
			return c.json({ error: 'Invalid book id' }, 400);
		}

		const body = await this.parseJsonBody(c);
		const service = this.getService(c.env);

		try {
			const result = await service.updateBookMetadataById(id, body);

			if (result.error) {
				return c.json({ error: result.error }, result.status);
			}

			return c.json({ data: result.data }, result.status);
		} catch (error) {
			return c.json({ error: error.message }, 400);
		}
	}
}

export const createBooksController = () => {
	return new BooksController();
};