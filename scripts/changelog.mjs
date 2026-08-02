import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { ConventionalChangelog } from 'conventional-changelog';

const workspaceRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const packagesRoot = resolve(workspaceRoot, 'packages');

const publishablePackages = readdirSync(packagesRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
        const packageRoot = resolve(packagesRoot, entry.name);
        const manifestPath = resolve(packageRoot, 'package.json');
        if (!existsSync(manifestPath)) return undefined;

        const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
        if (manifest.private === true) return undefined;

        return { manifest, manifestPath, packageRoot };
    })
    .filter((record) => record !== undefined);

await Promise.all(publishablePackages.map(writePackageChangelog));

async function writePackageChangelog({ manifest, manifestPath, packageRoot }) {
    const notes = await collectChangelogNotes({ manifestPath, packageRoot });
    if (notes.trim() === '') return;

    const changelogPath = resolve(packageRoot, 'CHANGELOG.md');
    const existing = existsSync(changelogPath) ? readFileSync(changelogPath, 'utf8') : '';
    writeFileSync(changelogPath, mergeChangelog(existing, manifest.name, notes));
}

function collectChangelogNotes({ manifestPath, packageRoot }) {
    const changelog = new ConventionalChangelog(workspaceRoot);
    changelog
        .loadPreset('conventionalcommits')
        .readPackage(manifestPath)
        .options({ releaseCount: 1 })
        .tags({ prefix: 'v' })
        .commits({ path: relativeToWorkspace(packageRoot) });

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

function relativeToWorkspace(path) {
    return path.slice(workspaceRoot.length + 1).replaceAll('\\', '/');
}

function mergeChangelog(existing, packageName, notes) {
    const releaseIndex = existing.indexOf('\n## ');
    if (releaseIndex === -1) {
        return `# ${packageName}\n\n${notes.trim()}\n`;
    }

    const header = existing.slice(0, releaseIndex + 1);
    const previousReleases = existing.slice(releaseIndex + 1).trimStart();
    return `${header}${notes.trimEnd()}\n\n${previousReleases}`;
}
