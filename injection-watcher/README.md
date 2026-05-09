# Injection Watcher

A Cloudflare Workers scheduled job that watches the `livro-inteligente-raw` R2 bucket for new book folders and enqueues them for processing via the `livro-inteligente-injection-queue` Queue.

## How It Works

- **Runs every 10 minutes** (configurable via `wrangler.jsonc` cron)
- **Lists all top-level folders** in the R2 bucket using the `/` delimiter
- **Cross-references against D1** `injected_books` table to find new or failed books
- **Enqueues new books** with status `QUEUED` and sends a message to the Queue
- **Retries failed books** by re-queuing any books with status `FAILED` and resetting them to `QUEUED`

## Configuration

All resources are defined in `wrangler.jsonc`:

- **R2 Bucket Binding**: `BOOKS_BUCKET` → `livro-inteligente-raw`
- **D1 Database Binding**: `DB` → `livro-inteligente` (database_id: `f76cc294-17a3-4a91-8ec2-b0a5a6aeb0af`)
- **Queue Producer Binding**: `INJECTION_QUEUE` → `livro-inteligente-injection-queue`
- **Cron Schedule**: `*/10 * * * *` (every 10 minutes)

## Local Development

### For Modern Linux Distros (glibc 2.35+)

If your system has glibc 2.35 or newer, you can run Wrangler directly:

```bash
npm install
npm run dev
```

This starts the dev server on `http://localhost:8787` with `--test-scheduled` enabled.

To trigger the scheduled handler manually:

```bash
curl "http://localhost:8787/__scheduled?cron=*/10+*+*+*+*"
```

The response will be a JSON object with the exact test URL you can use.

### For Old Linux Distros (glibc < 2.35)

Older Linux distributions don't have the required glibc symbols. Use Docker instead.

**Always expose port 8787** with the `-p` flag so you can access the dev server from your host machine:

```bash
docker run -it -p 8787:8787 -v $(pwd):/app -w /app node:22-bookworm bash
npm install
npm run dev
```

**Alternatively, use the provided `docker-compose.yml`:**

```bash
docker-compose run --rm wrangler-dev bash
npm install
npm run dev
```

Once running, trigger the scheduled handler from your host machine:

```bash
curl "http://localhost:8787/__scheduled?cron=*/10+*+*+*+*"
```

You should see a JSON response with the test URL and console output from the Worker in the container terminal.

## Testing with Real Resources

To test against the actual Cloudflare R2 bucket, D1 database, and Queue:

1. **Ensure you're authenticated** with Cloudflare:
   ```bash
   wrangler login
   ```
   or set the `CLOUDFLARE_API_TOKEN` environment variable.

2. **Start the dev server** (modern distro or Docker):
   ```bash
   npm run dev
   ```

3. **Trigger the scheduled handler**, which will:
   - List all book folders from `livro-inteligente-raw`
   - Query the `injected_books` table in D1
   - Enqueue any new or failed books
   - Log the results to the console

4. **Check the logs** in the terminal for output like:
   ```
   trigger fired at */10 * * * *: queued 3 of 5 folders (book-1, book-2, book-3)
   ```

## Deployment & Publishing

### Prerequisites

Before deploying, ensure you have:

1. **Cloudflare Account** with a project/zone
2. **Authentication** via `wrangler login`:
   ```bash
   wrangler login
   ```
   This opens a browser to authorize your Cloudflare account. Alternatively, set the `CLOUDFLARE_API_TOKEN` environment variable if you have an API token.

3. **R2 Bucket** `livro-inteligente-raw` created in your Cloudflare account
4. **D1 Database** `livro-inteligente` created with the `injected_books` table
5. **Queue** `livro-inteligente-injection-queue` created in your Cloudflare account

### Deploy to Cloudflare

From the `injection-watcher` directory:

```bash
npm run deploy
```

This will:
- Bundle the Worker code
- Upload it to Cloudflare
- Register the cron trigger (`*/10 * * * *`)
- Bind the R2 bucket, D1 database, and Queue

### Verify Deployment

After deployment, check the Cloudflare dashboard:

1. **Workers & Pages** → `injection-watcher` → View logs
2. **R2** → Verify `livro-inteligente-raw` bucket exists
3. **D1** → Verify `livro-inteligente` database and `injected_books` table exist
4. **Queues** → Verify `livro-inteligente-injection-queue` exists

The cron trigger will automatically run every 10 minutes. You can view scheduled execution logs in the Worker's detail page under **Logs**.

## Database Schema

The `injected_books` table in D1 must have at least these columns:

```sql
CREATE TABLE injected_books (
  id INTEGER PRIMARY KEY,
  folder_name TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL CHECK (status IN ('QUEUED', 'PROCESSING', 'SUCCESS', 'FAILED'))
);
```

The Worker does not create or manage the schema—it only reads and updates the `folder_name` and `status` columns.

## Queue Message Format

When the Worker enqueues a book, it sends a message to the Queue with this shape:

```json
{
  "folder_name": "book-slug-or-name",
  "source": "injection-watcher",
  "enqueued_at": "2026-05-09T10:30:00.000Z"
}
```

A consumer Worker should listen on the `livro-inteligente-injection-queue` queue and process these messages.

## Troubleshooting

### `glibc_2.32 not found` / `glibc_2.35 not found`

Your system has an older version of glibc. Use Docker as described above.

### Bindings are undefined in local dev

Ensure you've run `wrangler login` to authenticate with Cloudflare. The dev server needs credentials to bind to real R2, D1, and Queue resources.

### Queue messages not appearing

- Check that the Queue `livro-inteligente-injection-queue` exists in your Cloudflare account
- Verify that the Queue producer binding in `wrangler.jsonc` is correctly named `INJECTION_QUEUE`
- Look at Worker logs in the Cloudflare dashboard

### D1 query errors

- Verify the `injected_books` table exists in the `livro-inteligente` D1 database
- Check the database_id in `wrangler.jsonc` matches the actual database ID
- Ensure the table has at least the `folder_name` and `status` columns

## References

- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Wrangler CLI Reference](https://developers.cloudflare.com/workers/wrangler/install-and-update/)
- [R2 API Reference](https://developers.cloudflare.com/r2/api/workers-api-reference/)
- [D1 API Reference](https://developers.cloudflare.com/d1/platform/client-api/)
- [Queues API Reference](https://developers.cloudflare.com/queues/platform/api/)
