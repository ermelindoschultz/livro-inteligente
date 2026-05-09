# Livro Inteligente API

Cloudflare Workers API for the Livro Inteligente PWA.

This service is built with Hono and uses Cloudflare D1 for relational data storage. The current API manages book metadata and exposes endpoints to:

- list available books
- get book metadata by id
- create book metadata
- update book metadata

## Stack

- Cloudflare Workers
- Hono
- Cloudflare D1
- Wrangler
- Vitest with Cloudflare Workers pool

## Prerequisites

For local execution outside Docker:

- Node.js 22+
- npm 10+
- Cloudflare account authenticated in Wrangler for remote operations

Notes:

- Wrangler `4.90.x` expects Node.js 22+
- If your host machine has runtime/library issues, use the Docker workflow below

## Project Structure

```text
src/
  index.js
  routes.js
  books/
    books.controller.js
    books.service.js
    books.repository.js
migrations/
  0001_create_injected_books.sql
  0002_create_book_metadata.sql
test/
```

## Configuration

Current Worker configuration lives in [wrangler.jsonc](/mnt/home/www/livro-inteligente/livro-inteligente-api/wrangler.jsonc).

Important bindings and vars:

- `DB`: D1 binding for the `livro-inteligente` database
- `R2_PUBLIC_BASE_URL`: public base URL used to build book file URLs returned by the API

Example:

```json
"vars": {
  "R2_PUBLIC_BASE_URL": "https://books.example.com"
}
```

## Install Dependencies

```bash
npm ci
```

## Run Locally

Start the Worker locally with Wrangler:

```bash
npm run dev
```

Default local URL:

```text
http://localhost:8787
```

If you want to expose a specific host or port:

```bash
npm run dev -- --ip 0.0.0.0 --port 8787
```

## Apply D1 Migrations

Apply migrations to the local D1 database used by Wrangler:

```bash
npx wrangler d1 migrations apply livro-inteligente --local
```

Apply migrations to the remote D1 database:

```bash
npx wrangler d1 migrations apply livro-inteligente --remote
```

## Run Tests

```bash
npm test
```

If the local machine cannot run the Cloudflare test runtime because of Node or `glibc` constraints, use Docker instead.

## Run With Docker

This project does not require a Dockerfile for local containerized execution. You can run it directly with the official Node image.

Install dependencies in a container:

```bash
docker run --rm -it \
  -v "$PWD":/app \
  -w /app \
  node:22 \
  bash -lc "npm ci"
```

Run the Worker locally in Docker:

```bash
docker run --rm -it \
  -p 8787:8787 \
  -v "$PWD":/app \
  -w /app \
  node:22 \
  bash -lc "npm ci && npm run dev -- --ip 0.0.0.0 --port 8787"
```

Run tests in Docker:

```bash
docker run --rm -it \
  -v "$PWD":/app \
  -w /app \
  node:22 \
  bash -lc "npm ci && npm test"
```

If you need authenticated Cloudflare commands inside Docker, mount your Wrangler config:

```bash
docker run --rm -it \
  -v "$PWD":/app \
  -v "$HOME/.config/.wrangler":/root/.config/.wrangler \
  -w /app \
  node:22 \
  bash -lc "npx wrangler whoami"
```

## Deploy

### 1. Authenticate Wrangler

```bash
npx wrangler login
```

### 2. Confirm production config

Review [wrangler.jsonc](/mnt/home/www/livro-inteligente/livro-inteligente-api/wrangler.jsonc) and ensure:

- `database_name` and `database_id` point to the correct D1 database
- `R2_PUBLIC_BASE_URL` is configured for the target environment
- any future secrets are set with `wrangler secret put`

### 3. Apply remote migrations

```bash
npx wrangler d1 migrations apply livro-inteligente --remote
```

### 4. Deploy the Worker

```bash
npm run deploy
```

## API Endpoints

### Health

```http
GET /
```

Response:

```json
{
  "service": "livro-inteligente-api",
  "status": "ok"
}
```

### List Books

```http
GET /books
```

Returns only books with `status = SUCCESS`.

Response:

```json
{
  "data": [
    {
      "id": 1,
      "folderName": "transtorno-do-espectro-autista",
      "status": "SUCCESS",
      "title": "Autismo",
      "description": "Livro introdutorio",
      "authors": ["Equipe Livro Inteligente"],
      "r2FolderPath": "transtorno-do-espectro-autista/",
      "publishedAt": "2026-05-09",
      "publicUrl": "https://books.example.com/transtorno-do-espectro-autista/"
    }
  ]
}
```

### Get Book Metadata By Id

```http
GET /books/:id
```

Example:

```bash
curl http://localhost:8787/books/1
```

### Create Book Metadata

```http
POST /books
Content-Type: application/json
```

Request body:

```json
{
  "bookId": 1,
  "title": "Autismo",
  "description": "Livro introdutorio",
  "authors": ["Equipe Livro Inteligente"],
  "r2FolderPath": "transtorno-do-espectro-autista/",
  "publishedAt": "2026-05-09"
}
```

Notes:

- `bookId` must reference an existing row in `injected_books`
- metadata is one-to-one with the injected book
- creating metadata for the same `bookId` twice returns `409`

Example:

```bash
curl -X POST http://localhost:8787/books \
  -H "Content-Type: application/json" \
  -d '{
    "bookId": 1,
    "title": "Autismo",
    "description": "Livro introdutorio",
    "authors": ["Equipe Livro Inteligente"],
    "r2FolderPath": "transtorno-do-espectro-autista/",
    "publishedAt": "2026-05-09"
  }'
```

### Update Book Metadata

```http
PATCH /books/:id
Content-Type: application/json
```

You can send any subset of:

- `title`
- `description`
- `authors`
- `r2FolderPath`
- `publishedAt`

Example:

```bash
curl -X PATCH http://localhost:8787/books/1 \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Autismo Atualizado",
    "authors": ["Equipe Livro Inteligente", "Editor"]
  }'
```

## Database Model

### `injected_books`

- `id`
- `folder_name`
- `status`
- `created_at`
- `updated_at`

Allowed status values:

- `QUEUED`
- `PROCESSING`
- `SUCCESS`
- `FAILED`

### `book_metadata`

- `id`
- `book_id`
- `title`
- `description`
- `authors`
- `r2_folder_path`
- `published_at`
- `created_at`
- `updated_at`

## Notes For PWA Integration

- `publicUrl` is derived from `R2_PUBLIC_BASE_URL` and `r2FolderPath`
- `authors` is stored in D1 as JSON text and returned by the API as an array
- `GET /books` intentionally hides books that are not yet in `SUCCESS` status