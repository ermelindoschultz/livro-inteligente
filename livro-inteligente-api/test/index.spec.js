import {
	env,
	createExecutionContext,
	waitOnExecutionContext,
	SELF,
} from "cloudflare:test";
import { describe, it, expect } from "vitest";
import worker from "../src/index.js";

const createDbStub = ({ allResults = [], firstResult = null, runResult = { success: true } } = {}) => ({
	prepare(query) {
		return {
			bind(...params) {
				return {
					async all() {
						return {
							results: typeof allResults === 'function' ? allResults(query, params) : allResults,
						};
					},
					async first() {
						return typeof firstResult === 'function' ? firstResult(query, params) : firstResult;
					},
					async run() {
						return typeof runResult === 'function' ? runResult(query, params) : runResult;
					},
				};
			},
		};
	},
});

describe('Livro Inteligente API', () => {
	it('responds with service status at root (unit style)', async () => {
		const request = new Request('http://example.com/');
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		await waitOnExecutionContext(ctx);
		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({
			service: 'livro-inteligente-api',
			status: 'ok',
		});
	});

	it('adds CORS headers to books responses', async () => {
		const request = new Request('http://example.com/books', {
			headers: {
				origin: 'https://livro-inteligente.pages.dev',
			},
		});
		const ctx = createExecutionContext();
		const response = await worker.fetch(
			request,
			{
				...env,
				CORS_ALLOW_ORIGIN: '*',
				DB: createDbStub(),
			},
			ctx,
		);
		await waitOnExecutionContext(ctx);

		expect(response.status).toBe(200);
		expect(response.headers.get('access-control-allow-origin')).toBe('*');
	});

	it('handles CORS preflight requests', async () => {
		const request = new Request('http://example.com/books', {
			method: 'OPTIONS',
			headers: {
				origin: 'https://livro-inteligente.pages.dev',
				'access-control-request-method': 'GET',
			},
		});
		const ctx = createExecutionContext();
		const response = await worker.fetch(
			request,
			{
				...env,
				CORS_ALLOW_ORIGIN: '*',
				DB: createDbStub(),
			},
			ctx,
		);
		await waitOnExecutionContext(ctx);

		expect(response.status).toBe(204);
		expect(response.headers.get('access-control-allow-origin')).toBe('*');
		expect(response.headers.get('access-control-allow-methods')).toContain('GET');
	});

	it('lists available books (unit style)', async () => {
		const request = new Request('http://example.com/books');
		const ctx = createExecutionContext();
		const response = await worker.fetch(
			request,
			{
				...env,
				DB: createDbStub({
					allResults: [
						{
							id: 1,
							folder_name: 'transtorno-do-espectro-autista',
							status: 'SUCCESS',
							title: 'Autismo',
							description: 'Livro introdutorio',
							authors: '["Equipe Livro Inteligente"]',
							r2_folder_path: 'transtorno-do-espectro-autista/',
							published_at: '2026-05-09',
						},
					],
				}),
				R2_PUBLIC_BASE_URL: 'https://books.example.com',
			},
			ctx,
		);
		await waitOnExecutionContext(ctx);

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({
			data: [
				{
					id: 1,
					folderName: 'transtorno-do-espectro-autista',
					status: 'SUCCESS',
					title: 'Autismo',
					description: 'Livro introdutorio',
					authors: ['Equipe Livro Inteligente'],
					r2FolderPath: 'transtorno-do-espectro-autista/',
					publishedAt: '2026-05-09',
					publicUrl: 'https://books.example.com/transtorno-do-espectro-autista/',
				},
			],
		});
	});

	it('gets book metadata by id (unit style)', async () => {
		const request = new Request('http://example.com/books/1');
		const ctx = createExecutionContext();
		const response = await worker.fetch(
			request,
			{
				...env,
				DB: createDbStub({
					firstResult: {
						id: 1,
						folder_name: 'transtorno-do-espectro-autista',
						status: 'SUCCESS',
						title: 'Autismo',
						description: 'Livro introdutorio',
						authors: '["Equipe Livro Inteligente"]',
						r2_folder_path: 'transtorno-do-espectro-autista/',
						published_at: '2026-05-09',
					},
				}),
				R2_PUBLIC_BASE_URL: 'https://books.example.com',
			},
			ctx,
		);
		await waitOnExecutionContext(ctx);

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({
			data: {
				id: 1,
				folderName: 'transtorno-do-espectro-autista',
				status: 'SUCCESS',
				title: 'Autismo',
				description: 'Livro introdutorio',
				authors: ['Equipe Livro Inteligente'],
				r2FolderPath: 'transtorno-do-espectro-autista/',
				publishedAt: '2026-05-09',
				publicUrl: 'https://books.example.com/transtorno-do-espectro-autista/',
			},
		});
	});

	it('returns 404 for unknown book id (unit style)', async () => {
		const request = new Request('http://example.com/books/999');
		const ctx = createExecutionContext();
		const response = await worker.fetch(
			request,
			{
				...env,
				DB: createDbStub(),
			},
			ctx,
		);
		await waitOnExecutionContext(ctx);

		expect(response.status).toBe(404);
		expect(await response.json()).toEqual({
			error: 'Book not found',
		});
	});

	it('creates book metadata (unit style)', async () => {
		const request = new Request('http://example.com/books', {
			method: 'POST',
			headers: {
				'content-type': 'application/json',
			},
			body: JSON.stringify({
				bookId: 1,
				title: 'Autismo',
				description: 'Livro introdutorio',
				authors: ['Equipe Livro Inteligente'],
				r2FolderPath: 'transtorno-do-espectro-autista/',
				publishedAt: '2026-05-09',
			}),
		});
		const ctx = createExecutionContext();
		let findByIdCalls = 0;
		const response = await worker.fetch(
			request,
			{
				...env,
				DB: createDbStub({
					firstResult: (query) => {
						if (query.includes('FROM injected_books') && !query.includes('INNER JOIN')) {
							return {
								id: 1,
								folder_name: 'transtorno-do-espectro-autista',
								status: 'QUEUED',
							};
						}

						if (query.includes('INNER JOIN book_metadata')) {
							findByIdCalls += 1;
							if (findByIdCalls === 1) {
								return null;
							}

							return {
								id: 1,
								folder_name: 'transtorno-do-espectro-autista',
								status: 'QUEUED',
								title: 'Autismo',
								description: 'Livro introdutorio',
								authors: '["Equipe Livro Inteligente"]',
								r2_folder_path: 'transtorno-do-espectro-autista/',
								published_at: '2026-05-09',
							};
						}

						return null;
					},
				}),
				R2_PUBLIC_BASE_URL: 'https://books.example.com',
			},
			ctx,
		);
		await waitOnExecutionContext(ctx);

		expect(response.status).toBe(201);
		expect(await response.json()).toEqual({
			data: {
				id: 1,
				folderName: 'transtorno-do-espectro-autista',
				status: 'QUEUED',
				title: 'Autismo',
				description: 'Livro introdutorio',
				authors: ['Equipe Livro Inteligente'],
				r2FolderPath: 'transtorno-do-espectro-autista/',
				publishedAt: '2026-05-09',
				publicUrl: 'https://books.example.com/transtorno-do-espectro-autista/',
			},
		});
	});

	it('updates book metadata (unit style)', async () => {
		const request = new Request('http://example.com/books/1', {
			method: 'PATCH',
			headers: {
				'content-type': 'application/json',
			},
			body: JSON.stringify({
				title: 'Autismo Atualizado',
				authors: ['Equipe Livro Inteligente', 'Editor'],
			}),
		});
		const ctx = createExecutionContext();
		let findByIdCalls = 0;
		const response = await worker.fetch(
			request,
			{
				...env,
				DB: createDbStub({
					firstResult: (query) => {
						if (!query.includes('INNER JOIN book_metadata')) {
							return null;
						}

						findByIdCalls += 1;
						if (findByIdCalls === 1) {
							return {
								id: 1,
								folder_name: 'transtorno-do-espectro-autista',
								status: 'SUCCESS',
								title: 'Autismo',
								description: 'Livro introdutorio',
								authors: '["Equipe Livro Inteligente"]',
								r2_folder_path: 'transtorno-do-espectro-autista/',
								published_at: '2026-05-09',
							};
						}

						return {
							id: 1,
							folder_name: 'transtorno-do-espectro-autista',
							status: 'SUCCESS',
							title: 'Autismo Atualizado',
							description: 'Livro introdutorio',
							authors: '["Equipe Livro Inteligente","Editor"]',
							r2_folder_path: 'transtorno-do-espectro-autista/',
							published_at: '2026-05-09',
						};
					},
				}),
				R2_PUBLIC_BASE_URL: 'https://books.example.com',
			},
			ctx,
		);
		await waitOnExecutionContext(ctx);

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({
			data: {
				id: 1,
				folderName: 'transtorno-do-espectro-autista',
				status: 'SUCCESS',
				title: 'Autismo Atualizado',
				description: 'Livro introdutorio',
				authors: ['Equipe Livro Inteligente', 'Editor'],
				r2FolderPath: 'transtorno-do-espectro-autista/',
				publishedAt: '2026-05-09',
				publicUrl: 'https://books.example.com/transtorno-do-espectro-autista/',
			},
		});
	});

	it('validates create payload (unit style)', async () => {
		const request = new Request('http://example.com/books', {
			method: 'POST',
			headers: {
				'content-type': 'application/json',
			},
			body: JSON.stringify({
				bookId: 1,
			}),
		});
		const ctx = createExecutionContext();
		const response = await worker.fetch(
			request,
			{
				...env,
				DB: createDbStub(),
			},
			ctx,
		);
		await waitOnExecutionContext(ctx);

		expect(response.status).toBe(400);
		expect(await response.json()).toEqual({
			error: 'title is required',
		});
	});

	it('responds at root (integration style)', async () => {
		const response = await SELF.fetch('http://example.com/');
		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({
			service: 'livro-inteligente-api',
			status: 'ok',
		});
	});
});
