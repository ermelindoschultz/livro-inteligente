import { Hono } from 'hono';
import { createBooksController } from './books/books.controller.js';

export const createRoutes = () => {
	const app = new Hono();
	const booksController = createBooksController();

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