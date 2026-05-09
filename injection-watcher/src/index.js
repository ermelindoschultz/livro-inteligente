const BOOK_STATUS = {
	QUEUED: 'QUEUED',
	FAILED: 'FAILED',
};

const DEFAULT_CRON = '*/10 * * * *';
const RETRYABLE_STATUSES = new Set([BOOK_STATUS.FAILED]);
const QUERY_CHUNK_SIZE = 100;

export default {
	async fetch(req) {
		const url = new URL(req.url);
		url.pathname = '/__scheduled';
		url.searchParams.set('cron', DEFAULT_CRON);

		return new Response(
			JSON.stringify({
				ok: true,
				message: 'Trigger the scheduled watcher with Wrangler dev using --test-scheduled.',
				testUrl: url.href,
			}),
			{
				headers: {
					'content-type': 'application/json; charset=utf-8',
				},
			}
		);
	},

	async scheduled(event, env, ctx) {
		ctx.waitUntil(processScheduledRun(event, env));
	},
};

async function processScheduledRun(event, env) {
	const folderNames = await listRootFolderNames(env.BOOKS_BUCKET);

	if (folderNames.length === 0) {
		console.log(`trigger fired at ${event.cron}: no folders found in livro-inteligente-raw`);
		return;
	}

	const existingBooks = await loadInjectedBooks(env.DB, folderNames);
	const foldersToQueue = folderNames.filter((folderName) => {
		const existingStatus = existingBooks.get(folderName);
		return !existingStatus || RETRYABLE_STATUSES.has(existingStatus);
	});

	if (foldersToQueue.length === 0) {
		console.log(`trigger fired at ${event.cron}: ${folderNames.length} folders checked, nothing to queue`);
		return;
	}

	for (const folderName of foldersToQueue) {
		await env.INJECTION_QUEUE.send({
			folder_name: folderName,
			source: 'injection-watcher',
			enqueued_at: new Date().toISOString(),
		});

		await env.DB.prepare(
			`INSERT INTO injected_books (folder_name, status)
			 VALUES (?, ?)
			 ON CONFLICT(folder_name) DO UPDATE SET status = excluded.status`
		)
			.bind(folderName, BOOK_STATUS.QUEUED)
			.run();
	}

	console.log(
		`trigger fired at ${event.cron}: queued ${foldersToQueue.length} of ${folderNames.length} folders (${foldersToQueue.join(', ')})`
	);
}

async function listRootFolderNames(bucket) {
	const folderNames = [];
	let cursor;

	do {
		const result = await bucket.list({
			cursor,
			delimiter: '/',
		});

		for (const prefix of result.delimitedPrefixes ?? []) {
			const folderName = prefix.endsWith('/') ? prefix.slice(0, -1) : prefix;

			if (folderName) {
				folderNames.push(folderName);
			}
		}

		cursor = result.truncated ? result.cursor : undefined;
	} while (cursor);

	return [...new Set(folderNames)].sort((left, right) => left.localeCompare(right));
}

async function loadInjectedBooks(db, folderNames) {
	const existingBooks = new Map();

	for (let index = 0; index < folderNames.length; index += QUERY_CHUNK_SIZE) {
		const chunk = folderNames.slice(index, index + QUERY_CHUNK_SIZE);
		const placeholders = chunk.map(() => '?').join(', ');
		const statement = db.prepare(
			`SELECT folder_name, status
			 FROM injected_books
			 WHERE folder_name IN (${placeholders})`
		);
		const { results } = await statement.bind(...chunk).all();

		for (const row of results ?? []) {
			existingBooks.set(row.folder_name, row.status);
		}
	}

	return existingBooks;
}
