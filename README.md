# Livro Inteligente

An educational platform for downloading and reading books offline, with AI-generated trivia and gamification. Built entirely on Cloudflare's developer platform.

## Overview

Books are uploaded as raw HTML chapters to R2 object storage. An automated pipeline converts them to Markdown, enriches each chapter with AI-generated trivia using Workers AI, and produces structured metadata consumed by the PWA. Users can then browse available books, download them for offline use, and answer chapter quizzes.

## Architecture

```
R2 (raw HTML) ──► injection-watcher (cron) ──► Queue ──► make-book-intelligent (processor)
                                                                    │
                                                    R2 (processed) + D1 (metadata)
                                                                    │
                                              livro-inteligente-api ◄── livro-inteligente-pwa
```

See [ARCHITECTURE.md](ARCHITECTURE.md) for the full pipeline diagrams.

## Repository Structure

```
livro-inteligente/
├── injection-watcher/          # Cloudflare Worker — cron job that scans R2 and enqueues new books
├── make-book-intelligent/      # Cloudflare Worker — queue consumer that processes and enriches books
├── livro-inteligente-api/      # Cloudflare Worker — REST API serving book metadata to the PWA
├── livro-inteligente-pwa/      # Cloudflare Pages — React PWA with offline reading and trivia
└── examples/                   # Sample book ("Transtorno do Espectro Autista") showing expected HTML structure
```

### `injection-watcher`

Scheduled Worker (cron `*/10 * * * *`) that lists top-level folders in the `livro-inteligente-raw` R2 bucket, cross-references them against the `injected_books` D1 table to find new slugs, and enqueues each new slug to `livro-inteligente-injection-queue`.

### `make-book-intelligent`

Queue consumer Worker that receives a book slug and runs the full ingestion pipeline:

1. Reads HTML chapters from the source R2 bucket and converts them to Markdown.
2. Classifies files (chapter, section, activities, annex, about) and builds a chapter graph.
3. Calls Workers AI (`@cf/meta/llama-3.1-8b-instruct`) to generate trivia questions, boss trivia, and boss metadata for each chapter.
4. Writes processed Markdown files, `metadata.json`, and `manifest.json` to the destination R2 bucket.
5. Upserts the book record in D1 and sets status to `SUCCESS` or `FAILED`.

A `npm run ingest` script (`src/local.js`) allows running the pipeline locally against a real R2 bucket via S3-compatible credentials without Wrangler.

### `livro-inteligente-api`

Hono REST API exposing book metadata from D1. Handles CORS, lists books with `status = SUCCESS`, and exposes a `/books/:id/trivia/generate` endpoint to trigger on-demand trivia generation via Workers AI. See [livro-inteligente-api/API-DOC.md](livro-inteligente-api/API-DOC.md) for the full contract.

### `livro-inteligente-pwa`

React 19 PWA built with Vite, Tailwind CSS v4, TanStack Query, React Router v7, Dexie (IndexedDB), and `vite-plugin-pwa`. Two main views:

- **Library** — shelf of available books, download management, offline status.
- **Reader** — chapter-by-chapter reading with inline trivia, boss fights, and game progress.

The Service Worker caches all book assets in per-book Cache API buckets named `book-store-{id}` using `manifest.json` as the offline manifest.

### `examples/`

A complete sample book ("Transtorno do Espectro Autista") with HTML chapters and assets, plus `manifest.json` and `metadata.json` showing the expected output structure after processing.

---

## Prerequisites

- **Node.js 22+** and **npm 10+** (all Workers tooling requires Node 22)
- **Wrangler 4.90+** (installed per-project as a dev dependency)
- A **Cloudflare account** with the following resources provisioned:

| Resource | Name | Type |
|---|---|---|
| D1 database | `livro-inteligente` | D1 |
| R2 bucket | `livro-inteligente-raw` | R2 (source HTML) |
| R2 bucket | `livro-inteligente` | R2 (processed output) |
| Queue | `livro-inteligente-injection-queue` | Cloudflare Queue |
| Workers AI | — | AI binding (all Workers that use AI) |

---

## Cloudflare Resource Setup

### D1 database

```bash
wrangler d1 create livro-inteligente
```

Copy the returned `database_id` and confirm it matches the value in all `wrangler.jsonc` files (`f76cc294-17a3-4a91-8ec2-b0a5a6aeb0af`).

Run migrations from `livro-inteligente-api/`:

```bash
wrangler d1 migrations apply livro-inteligente --remote
```

### R2 buckets

```bash
wrangler r2 bucket create livro-inteligente-raw
wrangler r2 bucket create livro-inteligente
```

### Queue

```bash
wrangler queues create livro-inteligente-injection-queue
```

---

## Configuration

### `injection-watcher/wrangler.jsonc`

No environment variables. All configuration is through Wrangler bindings:

| Binding | Type | Resource |
|---|---|---|
| `BOOKS_BUCKET` | R2 | `livro-inteligente-raw` |
| `DB` | D1 | `livro-inteligente` |
| `INJECTION_QUEUE` | Queue producer | `livro-inteligente-injection-queue` |

### `make-book-intelligent/wrangler.jsonc`

| Binding | Type | Resource |
|---|---|---|
| `BOOKS_BUCKET` | R2 | `livro-inteligente-raw` |
| `PROCESSED_BUCKET` | R2 | `livro-inteligente` |
| `DB` | D1 | `livro-inteligente` |
| `AI` | Workers AI | — |

### `livro-inteligente-api/wrangler.jsonc`

| Binding / Variable | Type | Default | Description |
|---|---|---|---|
| `DB` | D1 | — | `livro-inteligente` database |
| `AI` | Workers AI | — | Used by `/books/:id/trivia/generate` |
| `CORS_ALLOW_ORIGIN` | var | `*` | Restrict allowed CORS origin in production |
| `R2_PUBLIC_BASE_URL` | var | `""` | Public base URL for the processed R2 bucket (e.g. `https://books.example.com`). Appended to `r2FolderPath` to form `publicUrl` in API responses. |

Override vars for production using `wrangler secret put` or by adding an `[env.production]` block in `wrangler.jsonc`.

### `livro-inteligente-pwa` — environment variables

Create a `.env` file (or set build-time variables in Cloudflare Pages):

| Variable | Required | Description |
|---|---|---|
| `VITE_API_BASE_URL` | Yes (production) | Base URL of the deployed `livro-inteligente-api` Worker, e.g. `https://api.example.com` |
| `VITE_R2_PUBLIC_ROOT` | No | Public base URL of the processed R2 bucket. Overrides per-book `publicUrl` from the API when set. |
| `VITE_ENABLE_PWA_DEV` | No | Set to `true` to enable the Service Worker during `vite dev` (disabled by default). |

In local development without `VITE_API_BASE_URL`, the PWA automatically falls back to `http://localhost:8787` when running on `localhost`.

---

## Local Development

Each sub-project is independent. Run them in separate terminals.

### API

```bash
cd livro-inteligente-api
npm install
npm run dev          # wrangler dev → http://localhost:8787
```

### PWA

```bash
cd livro-inteligente-pwa
npm install
npm run dev          # vite → http://localhost:5173
```

### injection-watcher

```bash
cd injection-watcher
npm install
npm run dev          # wrangler dev --test-scheduled
# Trigger the cron manually:
curl "http://localhost:8787/__scheduled?cron=*/10+*+*+*+*"
```

### make-book-intelligent

```bash
cd make-book-intelligent
npm install
npm run dev          # wrangler dev (queue consumer, needs a connected queue)
```

To run the ingestion pipeline locally without a live queue, use the local script (requires R2 credentials configured in the environment — see `src/local.js`):

```bash
npm run ingest -- --book <book-slug>
# With local output instead of R2:
npm run ingest -- --book <book-slug> --out
```

---

## Deployment

Deploy each Worker/Pages project independently from its directory:

```bash
# Workers
cd injection-watcher && npm run deploy
cd make-book-intelligent && npm run deploy
cd livro-inteligente-api && npm run deploy

# Cloudflare Pages
cd livro-inteligente-pwa && npm run deploy
```

`npm run deploy` in the PWA project runs `vite build` then `wrangler pages deploy ./dist`.

---

## Adding a Book

1. Upload the book's HTML chapters and assets into a folder inside the `livro-inteligente-raw` R2 bucket. The folder name becomes the book's slug (e.g. `transtorno-do-espectro-autista/`).
2. The `injection-watcher` cron picks up the new folder within 10 minutes and enqueues it.
3. `make-book-intelligent` processes the book, generates AI trivia, and writes the output to the `livro-inteligente` bucket.
4. The API exposes the book once its status reaches `SUCCESS`.

See the `examples/transtorno-do-espectro-autista/` folder for the expected HTML chapter structure.

---

## Database Schema

Managed by migrations in `livro-inteligente-api/migrations/`:

**`injected_books`** — tracks the ingestion lifecycle of each book slug.  
**`book_metadata`** — stores title, description, authors, folder path, and publication date exposed by the API.

Apply migrations:

```bash
cd livro-inteligente-api
wrangler d1 migrations apply livro-inteligente --remote
```
