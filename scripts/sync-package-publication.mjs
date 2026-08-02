import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { synchronizePackagePublication } from './package-publication.mjs';

const projectRoot = join(fileURLToPath(import.meta.url), '../..');
const modes = process.argv.slice(2);

if (modes.length !== 1 || !['--check', '--write'].includes(modes[0])) {
    throw new Error('Usage: node scripts/sync-package-publication.mjs --check|--write');
}

const mode = modes[0] === '--write' ? 'write' : 'check';
const { issues, writtenFiles } = synchronizePackagePublication(projectRoot, { mode });

if (issues.length > 0) throw new Error(formatIssues(issues));

if (mode === 'check') {
    console.log('Package publication files are synchronized.');
} else if (writtenFiles.length === 0) {
    console.log('Package publication files were already synchronized.');
} else {
    console.log(`Synchronized package publication files: ${writtenFiles.join(', ')}.`);
}

function formatIssues(publicationIssues) {
    const messages = publicationIssues.map(({ message }) => message);
    const hints = [...new Set(publicationIssues.flatMap(({ hint }) => (hint ? [hint] : [])))];
    return [...messages, ...hints].join('\n');
}
