# API Doc

Contract reference for the current Livro Inteligente API.

This file is intended to be easy to consume by both humans and AI agents.

## Service

- Name: `livro-inteligente-api`
- Runtime: Cloudflare Workers
- Framework: Hono
- Data store: Cloudflare D1
- Response format: JSON

## Base URL

Local development:

```text
http://localhost:8787
```

Production:

```text
Use the deployed Cloudflare Workers URL or custom domain.
```

## Conventions

- Request and response payloads use `camelCase`
- Successful responses return a `data` property, except `GET /`
- Error responses return an `error` property
- `GET /books` only returns books with `status = SUCCESS`
- `GET /books/:id` also only returns a book when its status is `SUCCESS`
- `POST /books` and `PATCH /books/:id` work on `book_metadata`

## Data Model

### Injected Book

Represents a book injection lifecycle entry.

Fields:

- `id`: integer
- `folder_name`: string
- `status`: `QUEUED` | `PROCESSING` | `SUCCESS` | `FAILED`
- `created_at`: datetime string
- `updated_at`: datetime string

### Book Metadata

Represents the metadata exposed to the PWA.

Fields stored in D1:

- `id`: integer
- `book_id`: integer
- `title`: string
- `description`: string | null
- `authors`: JSON string in database, array in API responses
- `r2_folder_path`: string
- `published_at`: string | null
- `created_at`: datetime string
- `updated_at`: datetime string

Fields returned by the API:

- `id`: integer
- `folderName`: string
- `status`: string
- `title`: string
- `description`: string | null
- `authors`: string[]
- `r2FolderPath`: string
- `publishedAt`: string | null
- `publicUrl`: string | null

Example API book object:

```json
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
```

## Endpoints

### 1. Health Check

Method:

```http
GET /
```

Description:

- Returns service health information

Success response:

Status: `200`

```json
{
  "service": "livro-inteligente-api",
  "status": "ok"
}
```

### 2. List Available Books

Method:

```http
GET /books
```

Description:

- Returns all books whose injected book status is `SUCCESS`
- Results are ordered by `title ASC`, then `id ASC`

Request body:

- none

Success response:

Status: `200`

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

Example:

```bash
curl http://localhost:8787/books
```

### 3. Get Book Metadata By Id

Method:

```http
GET /books/:id
```

Path params:

- `id`: positive integer

Description:

- Returns a single book metadata record by injected book id
- Only returns data when the book exists and its status is `SUCCESS`

Success response:

Status: `200`

```json
{
  "data": {
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
}
```

Error responses:

Status: `400`

```json
{
  "error": "Invalid book id"
}
```

Status: `404`

```json
{
  "error": "Book not found"
}
```

Example:

```bash
curl http://localhost:8787/books/1
```

### 4. Create Book Metadata

Method:

```http
POST /books
```

Description:

- Creates a `book_metadata` row linked to an existing `injected_books` row
- Metadata is one-to-one per injected book

Request headers:

- `Content-Type: application/json`

Request body schema:

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

Required fields:

- `bookId`: positive integer
- `title`: non-empty string
- `authors`: non-empty array of non-empty strings
- `r2FolderPath`: non-empty string

Optional fields:

- `description`: string
- `publishedAt`: string

Success response:

Status: `201`

```json
{
  "data": {
    "id": 1,
    "folderName": "transtorno-do-espectro-autista",
    "status": "QUEUED",
    "title": "Autismo",
    "description": "Livro introdutorio",
    "authors": ["Equipe Livro Inteligente"],
    "r2FolderPath": "transtorno-do-espectro-autista/",
    "publishedAt": "2026-05-09",
    "publicUrl": "https://books.example.com/transtorno-do-espectro-autista/"
  }
}
```

Error responses:

Status: `400`

```json
{
  "error": "Invalid request body"
}
```

Other `400` examples:

```json
{
  "error": "bookId must be a positive integer"
}
```

```json
{
  "error": "title is required"
}
```

```json
{
  "error": "authors must be a non-empty array of strings"
}
```

```json
{
  "error": "r2FolderPath is required"
}
```

Status: `404`

```json
{
  "error": "Injected book not found"
}
```

Status: `409`

```json
{
  "error": "Book metadata already exists"
}
```

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

### 5. Update Book Metadata

Method:

```http
PATCH /books/:id
```

Path params:

- `id`: positive integer

Description:

- Partially updates a `book_metadata` row by injected book id
- At least one updatable field must be provided

Request headers:

- `Content-Type: application/json`

Allowed request fields:

- `title`: non-empty string
- `description`: string | null
- `authors`: non-empty array of non-empty strings
- `r2FolderPath`: non-empty string
- `publishedAt`: string | null

Example request body:

```json
{
  "title": "Autismo Atualizado",
  "authors": ["Equipe Livro Inteligente", "Editor"]
}
```

Success response:

Status: `200`

```json
{
  "data": {
    "id": 1,
    "folderName": "transtorno-do-espectro-autista",
    "status": "SUCCESS",
    "title": "Autismo Atualizado",
    "description": "Livro introdutorio",
    "authors": ["Equipe Livro Inteligente", "Editor"],
    "r2FolderPath": "transtorno-do-espectro-autista/",
    "publishedAt": "2026-05-09",
    "publicUrl": "https://books.example.com/transtorno-do-espectro-autista/"
  }
}
```

Error responses:

Status: `400`

```json
{
  "error": "Invalid book id"
}
```

Other `400` examples:

```json
{
  "error": "Invalid request body"
}
```

```json
{
  "error": "At least one field must be provided"
}
```

```json
{
  "error": "title must be a non-empty string"
}
```

```json
{
  "error": "description must be a string or null"
}
```

```json
{
  "error": "authors must be a non-empty array of strings"
}
```

```json
{
  "error": "r2FolderPath must be a non-empty string"
}
```

```json
{
  "error": "publishedAt must be a string or null"
}
```

Status: `404`

```json
{
  "error": "Book not found"
}
```

Example:

```bash
curl -X PATCH http://localhost:8787/books/1 \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Autismo Atualizado",
    "authors": ["Equipe Livro Inteligente", "Editor"]
  }'
```

## AI Interaction Notes

If you are an AI agent consuming this API, prefer the following assumptions:

- Treat `id` in `/books/:id` as the injected book id
- Use `POST /books` only after the injected book already exists in `injected_books`
- Use `PATCH /books/:id` for partial updates only
- Expect `authors` as an array in API I/O, not as a JSON string
- Use `publicUrl` to access the public R2-backed book folder when available
- Do not expect non-success books to be returned by read endpoints

## Current Gaps

These capabilities are not implemented yet:

- delete book metadata
- pagination on `GET /books`
- filtering or sorting controls on `GET /books`
- full OpenAPI schema generation
- authenticated routes