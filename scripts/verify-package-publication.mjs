import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { verifyBuiltPackagePublication } from './package-publication.mjs';

const projectRoot = join(fileURLToPath(import.meta.url), '../..');
const { issues } = await verifyBuiltPackagePublication(projectRoot);

if (issues.length > 0) throw new Error(formatIssues(issues));

console.log('Built package matches the package publication contract.');

function formatIssues(publicationIssues) {
    const messages = publicationIssues.map(({ message }) => message);
    const hints = [...new Set(publicationIssues.flatMap(({ hint }) => (hint ? [hint] : [])))];
    return [...messages, ...hints].join('\n');
}
