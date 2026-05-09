import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

export function createLocalDest(outDir) {
	const baseDir = path.resolve(outDir);

	return {
		mode: 'local',

		async writeFile(relativePath, content) {
			const filePath = path.join(baseDir, relativePath);
			await mkdir(path.dirname(filePath), { recursive: true });
			await writeFile(filePath, content, 'utf8');
		},
	};
}