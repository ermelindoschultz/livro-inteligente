const BASE_BOOK_SELECT = `
	SELECT
		ib.id,
		ib.folder_name,
		ib.status,
		bm.title,
		bm.description,
		bm.authors,
		bm.r2_folder_path,
		bm.published_at
	FROM injected_books ib
	INNER JOIN book_metadata bm ON bm.book_id = ib.id
`;

export class BooksRepository {
	constructor(db) {
		this.db = db;
	}

	async findInjectedBookById(id) {
		const statement = this.db.prepare(`
			SELECT id, folder_name, status
			FROM injected_books
			WHERE id = ?
			LIMIT 1
		`);

		return statement.bind(id).first();
	}

	async findAllAvailable() {
		const statement = this.db.prepare(`
			${BASE_BOOK_SELECT}
			WHERE ib.status = ?
			ORDER BY bm.title ASC, ib.id ASC
		`);
		const { results } = await statement.bind('SUCCESS').all();

		return results ?? [];
	}

	async countAllAvailable() {
		const statement = this.db.prepare(`
			SELECT COUNT(*) AS total
			FROM injected_books ib
			INNER JOIN book_metadata bm ON bm.book_id = ib.id
			WHERE ib.status = ?
		`);
		const row = await statement.bind('SUCCESS').first();
		return row?.total ?? 0;
	}

	async findAllAvailablePaged(page, limit) {
		const offset = (page - 1) * limit;
		const statement = this.db.prepare(`
			${BASE_BOOK_SELECT}
			WHERE ib.status = ?
			ORDER BY bm.title ASC, ib.id ASC
			LIMIT ? OFFSET ?
		`);
		const { results } = await statement.bind('SUCCESS', limit, offset).all();
		return results ?? [];
	}


	async findAllAvailablePaged(page, limit) {
		const offset = (page - 1) * limit;
		const statement = this.db.prepare(`
			${BASE_BOOK_SELECT}
			WHERE ib.status = ?
			ORDER BY bm.title ASC, ib.id ASC
			LIMIT ? OFFSET ?
		`);
		const { results } = await statement.bind('SUCCESS', limit, offset).all();

		return results ?? [];
	}

	async findById(id) {
		const statement = this.db.prepare(`
			${BASE_BOOK_SELECT}
			WHERE ib.id = ?
			LIMIT 1
		`);

		return statement.bind(id).first();
	}

	async createMetadata({ bookId, title, description, authors, r2FolderPath, publishedAt }) {
		const statement = this.db.prepare(`
			INSERT INTO book_metadata (
				book_id,
				title,
				description,
				authors,
				r2_folder_path,
				published_at
			) VALUES (?, ?, ?, ?, ?, ?)
		`);

		await statement.bind(bookId, title, description, authors, r2FolderPath, publishedAt).run();

		return this.findById(bookId);
	}

	async updateMetadata(bookId, payload) {
		const assignments = [];
		const values = [];

		if (Object.prototype.hasOwnProperty.call(payload, 'title')) {
			assignments.push('title = ?');
			values.push(payload.title);
		}

		if (Object.prototype.hasOwnProperty.call(payload, 'description')) {
			assignments.push('description = ?');
			values.push(payload.description);
		}

		if (Object.prototype.hasOwnProperty.call(payload, 'authors')) {
			assignments.push('authors = ?');
			values.push(payload.authors);
		}

		if (Object.prototype.hasOwnProperty.call(payload, 'r2FolderPath')) {
			assignments.push('r2_folder_path = ?');
			values.push(payload.r2FolderPath);
		}

		if (Object.prototype.hasOwnProperty.call(payload, 'publishedAt')) {
			assignments.push('published_at = ?');
			values.push(payload.publishedAt);
		}

		const statement = this.db.prepare(`
			UPDATE book_metadata
			SET ${assignments.join(', ')}
			WHERE book_id = ?
		`);

		await statement.bind(...values, bookId).run();

		return this.findById(bookId);
	}
}