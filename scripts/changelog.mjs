import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { ConventionalChangelog } from 'conventional-changelog';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const manifestPath = resolve(repoRoot, 'package.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));

const notes = await collectChangelogNotes(manifestPath);
if (notes.trim() === '') {
    console.log('No new changelog entries.');
} else {
    const changelogPath = resolve(repoRoot, 'CHANGELOG.md');
    const existing = existsSync(changelogPath) ? readFileSync(changelogPath, 'utf8') : '';
    writeFileSync(changelogPath, mergeChangelog(existing, manifest.name, notes));
}

async function collectChangelogNotes(packageManifestPath) {
    const changelog = new ConventionalChangelog(repoRoot);
    changelog
        .loadPreset('conventionalcommits')
        .readPackage(packageManifestPath)
        .options({ releaseCount: 1 })
        .tags({ prefix: 'v' });

    return new Promise((resolveChangelog, rejectChangelog) => {
        let output = '';
        changelog
            .writeStream()
            .on('data', (chunk) => {
                output += chunk;
            })
            .on('end', () => resolveChangelog(output))
            .on('error', rejectChangelog);
    });
}

function mergeChangelog(existing, packageName, releaseNotes) {
    const releaseIndex = existing.indexOf('\n## ');
    if (releaseIndex === -1) {
        return `# ${packageName}\n\n${releaseNotes.trim()}\n`;
    }

    const header = existing.slice(0, releaseIndex + 1);
    const previousReleases = existing.slice(releaseIndex + 1).trimStart();
    return `${header}${releaseNotes.trimEnd()}\n\n${previousReleases}`;
}
