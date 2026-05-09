export async function persistBookMetadataStep(context, services) {
	const { bookMetadataStore, dest } = services;
	context.metadata.pipeline.current_step = 'persistBookMetadataStep';
	context.metadata.updated_at = new Date().toISOString();

	await dest.writeFile(`${context.bookSlug}/metadata.json`, JSON.stringify(context.metadata, null, 2));
	await bookMetadataStore.upsertBookMetadata({
		authors: context.metadata.authors,
		bookId: context.injectedBookId,
		description: context.metadata.description,
		publishedAt: context.metadata.published_at,
		r2FolderPath: context.metadata.r2_folder_path,
		title: context.metadata.title,
	});
}