import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { createBooksController } from './books/books.controller.js';

export const createRoutes = () => {
	const app = new Hono();
	const booksController = createBooksController();

	app.use(
		'*',
		cors({
			origin: (origin, c) => {
				const allowedOrigin = c.env.CORS_ALLOW_ORIGIN?.trim();

				if (!allowedOrigin || allowedOrigin === '*') {
					return '*';
				}

				return origin === allowedOrigin ? origin : allowedOrigin;
			},
			allowMethods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
			allowHeaders: ['Content-Type'],
			maxAge: 86400,
		})
	);

	app.get('/', (c) => {
		return c.json({
			service: 'livro-inteligente-api',
			status: 'ok',
		});
	});

	app.post('/books', (c) => booksController.create(c));
	app.get('/books', (c) => booksController.list(c));
	app.get('/books/:id', (c) => booksController.getById(c));
	app.patch('/books/:id', (c) => booksController.patch(c));

	return app;
};