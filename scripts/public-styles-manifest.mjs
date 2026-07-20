import { getAllDerivedColorVariableNames } from './color-system.mjs';
import { publicComponentVariables } from './public-styles-contract.mjs';
import { cssCustomProperty, isPublicToken, tokenPath } from './token-output-policy.mjs';

const derivedTokenMetadata = new Map([
    [
        '--rp-color-scheme',
        {
            type: 'string',
            description: 'Active Ropav color scheme (`light` or `dark`).',
        },
    ],
]);

export function createPublicStylesManifest(dictionary, darkTokenPaths) {
    const tokens = dictionary.allTokens.filter(isPublicToken).map((token) => {
        const path = tokenPath(token);
        return {
            name: cssCustomProperty(token),
            sourcePath: path.join('.'),
            type: token.$type ?? token.type ?? 'unknown',
            category: path[0],
            description:
                token.$description ??
                token.description ??
                `Public Ropav ${path[0]} token for ${path.join('.')}.`,
            themeApplicability: darkTokenPaths.has(path.join('.'))
                ? 'light-and-dark'
                : 'all-themes',
        };
    });

    for (const name of getAllDerivedColorVariableNames()) {
        const metadata = derivedTokenMetadata.get(name);
        tokens.push({
            name,
            sourcePath: `derived.${name.slice(5).replaceAll('-', '.')}`,
            type: metadata?.type ?? 'color',
            category: 'color',
            description: metadata?.description ?? `Derived public Ropav color token ${name}.`,
            themeApplicability: 'light-and-dark',
        });
    }

    tokens.sort((left, right) => left.name.localeCompare(right.name));

    return {
        schemaVersion: 1,
        contractVersion: 1,
        baseline: '5102a40',
        tokens,
        componentVariables: publicComponentVariables,
    };
}

export function serializePublicStylesManifest(manifest) {
    return `${JSON.stringify(manifest, null, 2)}\n`;
}

export function renderPublicTokenDocs(manifest) {
    const lines = [
        '# Public tokens',
        '',
        'This table is generated from `src/styles/styles-manifest.json`. A CSS variable is public only when its exact name appears below; the `--rp-` prefix alone does not make it public.',
        '',
        '## Color override contract',
        '',
        '`autoContrast` reads public `*-contrast` companion tokens. Browsers do not recompute those build-time choices after a consumer changes a background token, so each background role and its contrast companion form one required override group. For a preset solid role, declare the normal, hover, and contrast values in the same selector and cascade layer:',
        '',
        '```css',
        '@layer app {',
        '  :root {',
        '    --rp-color-blue-filled: #000;',
        '    --rp-color-blue-filled-hover: #111;',
        '    --rp-color-blue-contrast: #fff;',
        '  }',
        '}',
        '```',
        '',
        'Choose a companion with sufficient contrast against both normal and hover backgrounds. A palette shade is supported for consumer overrides only when its exact name is in this manifest; in that case, override the shade and its `*-contrast` companion together. Built-in preset solid roles prefer white text and select or darken their filled backgrounds accordingly; high-luminance lime and yellow roles retain black text. Keep `--rp-color-black` and `--rp-color-white` as readable dark and light contrast anchors.',
        '',
        '## Design tokens',
        '',
        '| Name | Source | Type | Theme | Description |',
        '| --- | --- | --- | --- | --- |',
    ];
    for (const token of manifest.tokens) {
        lines.push(
            `| \`${token.name}\` | \`${token.sourcePath}\` | ${token.type} | ${token.themeApplicability} | ${token.description} |`,
        );
    }
    lines.push('', '## Component geometry variables', '');
    lines.push('| Name | Component | Accepted value | Fallback | Description |');
    lines.push('| --- | --- | --- | --- | --- |');
    for (const variable of manifest.componentVariables) {
        lines.push(
            `| \`${variable.name}\` | ${variable.component} | \`${variable.acceptedValue}\` | ${variable.fallback} | ${variable.description} |`,
        );
    }
    return `${lines.join('\n')}\n`;
}
