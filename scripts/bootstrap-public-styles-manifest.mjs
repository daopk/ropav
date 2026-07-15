import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import StyleDictionary from 'style-dictionary';
import {
    createPublicStylesManifest,
    renderPublicTokenDocs,
    serializePublicStylesManifest,
} from './public-styles-manifest.mjs';

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const dictionary = new StyleDictionary({
    usesDtcg: true,
    source: ['tokens/default/**/*.tokens.json'],
    platforms: {},
});
await dictionary.hasInitialized;

const darkPaths = new Set();
collectTokenPaths(
    JSON.parse(readFileSync(join(projectRoot, 'tokens/dark/overrides.tokens.json'), 'utf8')),
    [],
    darkPaths,
);

const manifest = createPublicStylesManifest(dictionary, darkPaths);
const manifestPath = join(projectRoot, 'src/styles/styles-manifest.json');
writeFileSync(manifestPath, serializePublicStylesManifest(manifest));

const docsPath = join(projectRoot, 'docs/public-tokens.md');
mkdirSync(dirname(docsPath), { recursive: true });
writeFileSync(docsPath, renderPublicTokenDocs(manifest));

function collectTokenPaths(node, path, result) {
    if (node && typeof node === 'object' && '$value' in node) {
        result.add(path.join('.'));
        return;
    }
    for (const [key, value] of Object.entries(node ?? {})) {
        collectTokenPaths(value, [...path, key], result);
    }
}
