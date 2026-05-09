CREATE TABLE IF NOT EXISTS book_metadata (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	book_id INTEGER NOT NULL UNIQUE,
	title TEXT NOT NULL,
	description TEXT,
	authors TEXT NOT NULL,
	r2_folder_path TEXT NOT NULL,
	published_at TEXT,
	created_at TEXT NOT NULL DEFAULT (datetime('now')),
	updated_at TEXT NOT NULL DEFAULT (datetime('now')),
	FOREIGN KEY (book_id) REFERENCES injected_books(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_book_metadata_book_id ON book_metadata(book_id);

CREATE TRIGGER IF NOT EXISTS book_metadata_set_updated_at
AFTER UPDATE ON book_metadata
FOR EACH ROW
BEGIN
	UPDATE book_metadata
	SET updated_at = datetime('now')
	WHERE id = NEW.id;
END;