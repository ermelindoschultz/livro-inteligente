function normalizeAuthors(authors) {
	return JSON.stringify(
		(authors ?? [])
			.map((author) => (typeof author === 'string' ? author.trim() : ''))
			.filter(Boolean)
	);
}

function normalizeBookMetadataPayload(payload) {
	return {
		authors: normalizeAuthors(payload.authors),
		bookId: payload.bookId,
		description: payload.description ?? null,
		publishedAt: payload.publishedAt ?? null,
		r2FolderPath: payload.r2FolderPath,
		title: payload.title,
	};
}

export function createD1BookMetadataStore(db) {
	return {
		async findInjectedBookByFolderName(folderName) {
			const result = await db
				.prepare(
					`SELECT id, folder_name, status
					 FROM injected_books
					 WHERE folder_name = ?`
				)
				.bind(folderName)
				.first();

			return result ?? null;
		},

		async updateInjectedBookStatus(id, status) {
			await db
				.prepare(
					`UPDATE injected_books
					 SET status = ?
					 WHERE id = ?`
				)
				.bind(status, id)
				.run();
		},

		async upsertBookMetadata(payload) {
			const normalized = normalizeBookMetadataPayload(payload);

			await db
				.prepare(
					`INSERT INTO book_metadata (
						book_id,
						title,
						description,
						authors,
						r2_folder_path,
						published_at
					) VALUES (?, ?, ?, ?, ?, ?)
					ON CONFLICT(book_id) DO UPDATE SET
						title = excluded.title,
						description = excluded.description,
						authors = excluded.authors,
						r2_folder_path = excluded.r2_folder_path,
						published_at = excluded.published_at`
				)
				.bind(
					normalized.bookId,
					normalized.title,
					normalized.description,
					normalized.authors,
					normalized.r2FolderPath,
					normalized.publishedAt
				)
				.run();
		},
	};
}

async function queryD1(config, sql, params = []) {
	const response = await fetch(
		`https://api.cloudflare.com/client/v4/accounts/${config.accountId}/d1/database/${config.databaseId}/query`,
		{
			method: 'POST',
			headers: {
				Authorization: `Bearer ${config.apiToken}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ params, sql }),
		}
	);

	if (!response.ok) {
		throw new Error(`D1 API request failed with status ${response.status}`);
	}

	const payload = await response.json();
	if (!payload.success) {
		throw new Error(payload.errors?.[0]?.message ?? 'Unknown D1 API error');
	}

	return payload.result?.[0] ?? { results: [] };
}

export function createRemoteBookMetadataStore(config) {
	if (!config.accountId || !config.apiToken || !config.databaseId) {
		throw new Error(
			'Missing D1 configuration. Expected CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN, and D1_DATABASE_ID.'
		);
	}

	return {
		async findInjectedBookByFolderName(folderName) {
			const result = await queryD1(
				config,
				`SELECT id, folder_name, status
				 FROM injected_books
				 WHERE folder_name = ?`,
				[folderName]
			);

			return result.results?.[0] ?? null;
		},

		async updateInjectedBookStatus(id, status) {
			await queryD1(
				config,
				`UPDATE injected_books
				 SET status = ?
				 WHERE id = ?`,
				[status, id]
			);
		},

		async upsertBookMetadata(payload) {
			const normalized = normalizeBookMetadataPayload(payload);

			await queryD1(
				config,
				`INSERT INTO book_metadata (
					book_id,
					title,
					description,
					authors,
					r2_folder_path,
					published_at
				) VALUES (?, ?, ?, ?, ?, ?)
				ON CONFLICT(book_id) DO UPDATE SET
					title = excluded.title,
					description = excluded.description,
					authors = excluded.authors,
					r2_folder_path = excluded.r2_folder_path,
					published_at = excluded.published_at`,
				[
					normalized.bookId,
					normalized.title,
					normalized.description,
					normalized.authors,
					normalized.r2FolderPath,
					normalized.publishedAt,
				]
			);
		},
	};
}