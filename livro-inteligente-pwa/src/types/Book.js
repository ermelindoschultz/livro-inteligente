/**
 * @typedef {'idle' | 'pending' | 'completed' | 'failed'} BookDownloadStatus
 */

/**
 * @typedef {Object} BookChapter
 * @property {string | null | undefined} [file_path]
 * @property {string | null | undefined} [markdown_path]
 */

/**
 * @typedef {Object} BookMetadata
 * @property {string | null | undefined} [entry]
 * @property {string | null | undefined} [startPage]
 * @property {string | null | undefined} [homepage]
 * @property {Array<string | Object>} [files]
 * @property {Array<string | Object>} [assets]
 * @property {Array<string | Object>} [resources]
 * @property {Array<string | Object>} [downloadables]
 * @property {BookChapter[]} [chapters]
 */

/**
 * @typedef {Object} Book
 * @property {number} id
 * @property {string} title
 * @property {string | null} [description]
 * @property {string[]} [authors]
 * @property {string | null} [folderName]
 * @property {string | null} [status]
 * @property {string | null} [r2FolderPath]
 * @property {string | null} [publishedAt]
 * @property {string | null} [publicUrl]
 * @property {string | null} [metadataUrl]
 * @property {BookMetadata | null} [metadataSnapshot]
 * @property {boolean} [isDownloaded]
 * @property {BookDownloadStatus} [downloadStatus]
 * @property {number} [downloadProgress]
 * @property {number} [fileCount]
 * @property {number} [cachedFileCount]
 * @property {string | null} [downloadedAt]
 * @property {string | null} [lastOpenedAt]
 * @property {string | null} [lastSyncedAt]
 * @property {string | null} [updatedAt]
 */

export const BOOK_DOWNLOAD_STATUSES = ['idle', 'pending', 'completed', 'failed']