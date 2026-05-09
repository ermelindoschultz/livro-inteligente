CREATE TABLE IF NOT EXISTS injected_books (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	folder_name TEXT NOT NULL UNIQUE,
	status TEXT NOT NULL DEFAULT 'QUEUED' CHECK (status IN ('QUEUED', 'PROCESSING', 'SUCCESS', 'FAILED')),
	created_at TEXT NOT NULL DEFAULT (datetime('now')),
	updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TRIGGER IF NOT EXISTS injected_books_set_updated_at
AFTER UPDATE ON injected_books
FOR EACH ROW
BEGIN
	UPDATE injected_books
	SET updated_at = datetime('now')
	WHERE id = NEW.id;
END;