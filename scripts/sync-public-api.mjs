import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
    assertComponentInventory,
    createExpectedPackageExports,
    getGeneratedArtifactIssues,
    publicApiManifest,
    renderRootIndex,
    validatePublicApiManifest,
} from './public-api.mjs';

const projectRoot = join(fileURLToPath(import.meta.url), '../..');
const indexPath = join(projectRoot, publicApiManifest.root.source);
const packagePath = join(projectRoot, 'package.json');
const modes = process.argv.slice(2);

if (modes.length !== 1 || !['--check', '--write'].includes(modes[0])) {
    throw new Error('Usage: node scripts/sync-public-api.mjs --check|--write');
}

validatePublicApiManifest();
assertComponentInventory(projectRoot);

const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
const expectedIndex = renderRootIndex();

if (modes[0] === '--write') {
    packageJson.main = publicApiManifest.root.import;
    packageJson.module = publicApiManifest.root.import;
    packageJson.types = publicApiManifest.root.types;
    packageJson.exports = createExpectedPackageExports();

    writeFileSync(indexPath, expectedIndex);
    writeFileSync(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`);
    console.log('Synchronized src/index.ts and package.json with the public API manifest.');
} else {
    const issues = getGeneratedArtifactIssues({
        indexSource: readFileSync(indexPath, 'utf8'),
        packageJson,
    });
    if (issues.length > 0) {
        throw new Error(
            `${issues.join('\n')}\nRun \`pnpm public-api:sync\` to update generated files.`,
        );
    }
    console.log('Public API generated files are synchronized.');
}
