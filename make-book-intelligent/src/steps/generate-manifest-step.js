function compareManifestEntries(left, right) {
	return left.localeCompare(right, 'pt-BR', { numeric: true, sensitivity: 'base' });
}

function buildManifestEntries(context, assetPaths) {
	const entries = [
		'manifest.json',
		'metadata.json',
		...context.metadata.chapters.map((chapter) => chapter.file_path),
		...assetPaths,
	];

	return [...new Set(entries)].sort(compareManifestEntries);
}

export async function generateManifestStep(context, services) {
	const { dest, source } = services;
	context.metadata.pipeline.current_step = 'generateManifestStep';

	const assetPaths = (await source.listAssetFiles?.(context.bookSlug)) ?? [];
	const manifestEntries = buildManifestEntries(context, assetPaths);

	context.metadata.updated_at = new Date().toISOString();
	await dest.writeFile(`${context.bookSlug}/metadata.json`, JSON.stringify(context.metadata, null, 2));
	await dest.writeFile(`${context.bookSlug}/manifest.json`, JSON.stringify(manifestEntries, null, 2));
}