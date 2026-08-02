import { getAllDerivedColorVariableNames, oldSemanticColorVariables } from './color-system.mjs';
import {
    cssCustomProperty,
    hasCssCustomProperty,
    isPublicToken,
    tokenPath,
} from './token-output-policy.mjs';

const schemaVersion = 2;
const contractVersion = 2;

const publicComponentVariables = [
    {
        name: '--rp-switch-track-width',
        component: 'Switch',
        acceptedValue: '<length>',
        fallback: 'size preset track width',
        description: 'Width shared by the Switch track and thumb travel calculation.',
    },
    {
        name: '--rp-switch-track-height',
        component: 'Switch',
        acceptedValue: '<length>',
        fallback: 'size preset track height',
        description: 'Height of the Switch track.',
    },
    {
        name: '--rp-switch-thumb-size',
        component: 'Switch',
        acceptedValue: '<length>',
        fallback: 'size preset thumb size',
        description: 'Diameter of the Switch thumb.',
    },
    {
        name: '--rp-switch-thumb-offset',
        component: 'Switch',
        acceptedValue: '<length>',
        fallback: '2px',
        description: 'Inset used for the Switch thumb at both ends of the track.',
    },
    {
        name: '--rp-slider-track-length',
        component: 'Slider, RangeSlider',
        acceptedValue: '<length>',
        fallback: '160px',
        description: 'Minimum track length for a horizontal or vertical slider.',
    },
    {
        name: '--rp-slider-track-thickness',
        component: 'Slider, RangeSlider',
        acceptedValue: '<length>',
        fallback: 'size preset track thickness',
        description: 'Thickness shared by the track and native range pseudo-elements.',
    },
    {
        name: '--rp-slider-thumb-size',
        component: 'Slider, RangeSlider',
        acceptedValue: '<length>',
        fallback: 'size preset thumb size',
        description: 'Diameter shared by native and custom slider thumbs.',
    },
    {
        name: '--rp-slider-thumb-border-width',
        component: 'Slider, RangeSlider',
        acceptedValue: '<line-width>',
        fallback: 'size preset thumb border width',
        description: 'Border width shared by native and custom slider thumbs.',
    },
    {
        name: '--rp-slider-thumb-padding',
        component: 'Slider, RangeSlider',
        acceptedValue: '<length>',
        fallback: '0',
        description: 'Inner padding for custom slider thumb content.',
    },
    {
        name: '--rp-slider-mark-size',
        component: 'Slider, RangeSlider',
        acceptedValue: '<length>',
        fallback: 'size preset mark size',
        description: 'Diameter of slider marks.',
    },
    {
        name: '--rp-radio-control-size',
        component: 'Radio',
        acceptedValue: '<length>',
        fallback: 'size preset control size',
        description: 'Diameter of the Radio control.',
    },
    {
        name: '--rp-radio-dot-size',
        component: 'Radio',
        acceptedValue: '<length>',
        fallback: 'size preset dot size',
        description: 'Diameter of the checked Radio dot.',
    },
];

const publicComponentVariableNames = new Set(publicComponentVariables.map(({ name }) => name));

const derivedTokenMetadata = new Map([
    [
        '--rp-color-scheme',
        {
            type: 'string',
            description: 'Active Ropav color scheme (`light` or `dark`).',
        },
    ],
]);

const tokenSemanticFields = ['sourcePath', 'type', 'category', 'themeApplicability'];
const componentVariableSemanticFields = ['component', 'acceptedValue', 'fallback'];
const generatedTokenFields = [...tokenSemanticFields, 'description'];
const generatedComponentVariableFields = [...componentVariableSemanticFields, 'description'];

export function buildPublicStylesArtifacts({ tokens, darkTokenPaths }) {
    const manifest = createManifest(tokens, darkTokenPaths);

    return {
        manifest,
        manifestJson: `${JSON.stringify(manifest, null, 2)}\n`,
        documentation: renderDocumentation(manifest),
    };
}

export function verifyPublicStylesContract({
    tokens,
    darkTokenPaths,
    currentManifest,
    releasedBaseline,
    generatedCss,
    documentation,
    componentSources,
    consumerSources,
}) {
    const documentedPublicVariables = collectDocumentedPublicVariables(documentation);

    return [
        ...verifyPublicTokenMetadata(tokens),
        ...verifyManifestMatchesSources(tokens, darkTokenPaths, currentManifest),
        ...verifyGeneratedCss(currentManifest, generatedCss),
        ...verifyManifest(currentManifest, documentedPublicVariables),
        ...verifyReleasedCompatibility(releasedBaseline, currentManifest),
        ...verifyComponentVariables(currentManifest, documentedPublicVariables, componentSources),
        ...verifyConsumerSources(consumerSources),
    ];
}

function createManifest(tokens, darkTokenPaths) {
    const publicTokens = tokens.filter(isPublicToken).map((token) => {
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
        publicTokens.push({
            name,
            sourcePath: `derived.${name.slice(5).replaceAll('-', '.')}`,
            type: metadata?.type ?? 'color',
            category: 'color',
            description: metadata?.description ?? `Derived public Ropav color token ${name}.`,
            themeApplicability: 'light-and-dark',
        });
    }

    publicTokens.sort((left, right) => left.name.localeCompare(right.name));

    return {
        schemaVersion,
        contractVersion,
        tokens: publicTokens,
        componentVariables: publicComponentVariables.map((variable) => ({ ...variable })),
    };
}

function renderDocumentation(manifest) {
    const lines = [
        '# Public tokens',
        '',
        'This table is generated from `src/styles/styles-manifest.json`. A CSS variable is public only when its exact name appears below; the `--rp-` prefix alone does not make it public.',
        '',
        '## Color override contract',
        '',
        '`autoContrast` reads public state-specific `*-contrast` companion tokens. Browsers do not recompute those build-time choices after a consumer changes a background token, so each background role and its contrast companions form one required override group. For a preset solid role, declare the normal, hover, and contrast values in the same selector and cascade layer:',
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
        "Choose a preset companion with sufficient contrast against its normal, hover, and derived active backgrounds. For a palette shade, normal uses its `*-contrast` companion, hover uses the next shade and that shade's companion, and active uses its `*-active-contrast` companion. Override a shade, its normal companion, and its active companion together; override the next shade pair too when customizing hover. Built-in preset solid roles prefer white text and select or darken their filled backgrounds accordingly; high-luminance lime and yellow roles retain black text. Keep `--rp-color-black` and `--rp-color-white` as readable dark and light contrast anchors.",
        '',
        '## Design tokens',
        '',
    ];
    pushMarkdownTable(
        lines,
        ['Name', 'Source', 'Type', 'Theme', 'Description'],
        manifest.tokens.map((token) => [
            `\`${token.name}\``,
            `\`${token.sourcePath}\``,
            token.type,
            token.themeApplicability,
            token.description,
        ]),
    );
    lines.push('', '## Component geometry variables', '');
    pushMarkdownTable(
        lines,
        ['Name', 'Component', 'Accepted value', 'Fallback', 'Description'],
        manifest.componentVariables.map((variable) => [
            `\`${variable.name}\``,
            variable.component,
            `\`${variable.acceptedValue}\``,
            variable.fallback,
            variable.description,
        ]),
    );
    return `${lines.join('\n')}\n`;
}

function pushMarkdownTable(lines, headers, rows) {
    const widths = headers.map((header, index) =>
        Math.max(header.length, ...rows.map((row) => row[index].length)),
    );
    const renderRow = (row) =>
        `| ${row.map((cell, index) => cell.padEnd(widths[index])).join(' | ')} |`;

    lines.push(renderRow(headers));
    lines.push(`| ${widths.map((width) => '-'.repeat(width)).join(' | ')} |`);
    lines.push(...rows.map(renderRow));
}

function collectDocumentedPublicVariables(documentation) {
    return new Set(
        [...documentation.matchAll(/^\|\s+`(--rp-[^`]+)`\s+\|/gm)].map((match) => match[1]),
    );
}

function verifyPublicTokenMetadata(tokens) {
    const failures = [];

    for (const token of tokens.filter(isPublicToken)) {
        if (!hasCssCustomProperty(token)) {
            failures.push(
                `public token ${tokenPath(token).join('.')} must also emit a CSS custom property`,
            );
        }
    }

    return failures;
}

function verifyManifestMatchesSources(tokens, darkTokenPaths, currentManifest) {
    const expectedManifest = createManifest(tokens, darkTokenPaths);
    const failures = [];

    for (const field of ['schemaVersion', 'contractVersion']) {
        if (JSON.stringify(currentManifest[field]) !== JSON.stringify(expectedManifest[field])) {
            failures.push(
                `current manifest ${field} does not match the generated contract (${formatValue(currentManifest[field])} instead of ${formatValue(expectedManifest[field])})`,
            );
        }
    }

    compareGeneratedEntries({
        kind: 'token',
        expectedEntries: expectedManifest.tokens,
        currentEntries: currentManifest.tokens ?? [],
        fields: generatedTokenFields,
        failures,
    });
    compareGeneratedEntries({
        kind: 'component variable',
        expectedEntries: expectedManifest.componentVariables,
        currentEntries: currentManifest.componentVariables ?? [],
        fields: generatedComponentVariableFields,
        failures,
    });

    return failures;
}

function compareGeneratedEntries({ kind, expectedEntries, currentEntries, fields, failures }) {
    verifyUniqueEntryNames(expectedEntries, kind, 'generated contract', failures);
    verifyUniqueEntryNames(currentEntries, kind, 'current manifest', failures);

    const expectedByName = new Map(expectedEntries.map((entry) => [entry.name, entry]));
    const currentByName = new Map(currentEntries.map((entry) => [entry.name, entry]));

    for (const [name, expectedEntry] of expectedByName) {
        const currentEntry = currentByName.get(name);
        if (!currentEntry) {
            failures.push(`generated ${kind} ${name} is missing from the current manifest`);
            continue;
        }

        for (const field of fields) {
            if (JSON.stringify(currentEntry[field]) !== JSON.stringify(expectedEntry[field])) {
                failures.push(
                    `current manifest ${kind} ${name} does not match generated ${field} (${formatValue(currentEntry[field])} instead of ${formatValue(expectedEntry[field])})`,
                );
            }
        }
    }

    for (const name of currentByName.keys()) {
        if (!expectedByName.has(name)) {
            failures.push(`current manifest contains unexpected ${kind} ${name}`);
        }
    }
}

function verifyUniqueEntryNames(entries, kind, owner, failures) {
    const seen = new Set();

    for (const { name } of entries) {
        if (seen.has(name)) {
            failures.push(`${owner} contains duplicate ${kind} ${name}`);
        }
        seen.add(name);
    }
}

function verifyGeneratedCss(manifest, generatedCss) {
    const generatedNames = new Set();
    const failures = [];

    for (const [, name] of generatedCss.matchAll(/^\s+(--rp-[a-z0-9-]+)\s*:/gim)) {
        generatedNames.add(name);

        if (oldSemanticColorVariables.has(name)) {
            failures.push(`old semantic CSS custom property ${name} was generated`);
        }
    }

    for (const { name } of manifest.tokens ?? []) {
        if (!generatedNames.has(name)) failures.push(`manifest token ${name} is not generated`);
    }

    return failures;
}

function verifyManifest(manifest, documentedPublicVariables) {
    const failures = [];
    const seen = new Set();

    if (manifest.schemaVersion !== schemaVersion) {
        failures.push('public styles manifest has an unsupported schemaVersion');
    }
    if (!Number.isSafeInteger(manifest.contractVersion)) {
        failures.push('public styles manifest has an invalid contractVersion');
    }
    for (const token of manifest.tokens ?? []) {
        for (const field of [
            'name',
            'sourcePath',
            'type',
            'category',
            'description',
            'themeApplicability',
        ]) {
            if (!token[field]) {
                failures.push(`manifest token ${token.name ?? '<unknown>'} misses ${field}`);
            }
        }
        if (seen.has(token.name)) failures.push(`manifest contains duplicate token ${token.name}`);
        seen.add(token.name);
        if (!documentedPublicVariables.has(token.name)) {
            failures.push(`public token documentation is missing ${token.name}`);
        }
    }

    const expectedDocumentedNames = new Set([
        ...(manifest.tokens ?? []).map(({ name }) => name),
        ...publicComponentVariableNames,
    ]);
    for (const name of documentedPublicVariables) {
        if (!expectedDocumentedNames.has(name)) {
            failures.push(`public token documentation contains non-manifest variable ${name}`);
        }
    }

    return failures;
}

function verifyReleasedCompatibility(releasedBaseline, currentManifest) {
    if (releasedBaseline.failure) return [releasedBaseline.failure];

    return compareManifests(releasedBaseline.manifest, currentManifest, releasedBaseline.ref);
}

function compareManifests(releasedManifest, currentManifest, baselineRef) {
    const failures = [];
    const additions = [];

    compareStableEntries({
        kind: 'token',
        releasedEntries: releasedManifest.tokens ?? [],
        currentEntries: currentManifest.tokens ?? [],
        semanticFields: tokenSemanticFields,
        failures,
        additions,
        baselineRef,
    });
    compareStableEntries({
        kind: 'component variable',
        releasedEntries: releasedManifest.componentVariables ?? [],
        currentEntries: currentManifest.componentVariables ?? [],
        semanticFields: componentVariableSemanticFields,
        failures,
        additions,
        baselineRef,
    });

    const releasedVersion = releasedManifest.contractVersion ?? 0;
    const currentVersion = currentManifest.contractVersion;
    if (!Number.isSafeInteger(currentVersion) || currentVersion < 1) {
        failures.push('public styles manifest contractVersion must be a positive integer');
    } else if (!Number.isSafeInteger(releasedVersion) || releasedVersion < 0) {
        failures.push(
            `${baselineRef} has an invalid public styles contractVersion (${formatValue(releasedVersion)})`,
        );
    } else if (currentVersion < releasedVersion) {
        failures.push(
            `public styles contractVersion ${currentVersion} is older than ${baselineRef} contractVersion ${releasedVersion}`,
        );
    } else if (additions.length > 0 && currentVersion <= releasedVersion) {
        failures.push(
            `public styles contractVersion must increase above ${releasedVersion} when adding ${additions.join(', ')}`,
        );
    }

    return failures;
}

function compareStableEntries({
    kind,
    releasedEntries,
    currentEntries,
    semanticFields,
    failures,
    additions,
    baselineRef,
}) {
    const releasedByName = new Map(releasedEntries.map((entry) => [entry.name, entry]));
    const currentByName = new Map(currentEntries.map((entry) => [entry.name, entry]));

    for (const [name, releasedEntry] of releasedByName) {
        const currentEntry = currentByName.get(name);
        if (!currentEntry) {
            failures.push(`${baselineRef} stable ${kind} ${name} was removed or renamed`);
            continue;
        }

        for (const field of semanticFields) {
            if (JSON.stringify(releasedEntry[field]) !== JSON.stringify(currentEntry[field])) {
                failures.push(
                    `${baselineRef} stable ${kind} ${name} changed ${field} from ${formatValue(releasedEntry[field])} to ${formatValue(currentEntry[field])}`,
                );
            }
        }
    }

    for (const name of currentByName.keys()) {
        if (!releasedByName.has(name)) additions.push(`${kind} ${name}`);
    }
}

function verifyComponentVariables(manifest, documentedPublicVariables, componentSources) {
    const failures = [];
    const manifestNames = new Set((manifest.componentVariables ?? []).map(({ name }) => name));
    if (
        manifestNames.size !== publicComponentVariableNames.size ||
        [...publicComponentVariableNames].some((name) => !manifestNames.has(name))
    ) {
        failures.push('manifest componentVariables do not match the public geometry allowlist');
    }

    const componentContents = componentSources.map(({ contents }) => contents).join('\n');
    const geometryNames = new Set(
        componentContents.match(/--rp-(?:switch|slider|radio)-[a-z0-9-]+/g) ?? [],
    );
    for (const name of geometryNames) {
        if (!publicComponentVariableNames.has(name)) {
            failures.push(`component source uses non-allowlisted public geometry variable ${name}`);
        }
    }
    for (const { name } of publicComponentVariables) {
        if (!geometryNames.has(name)) failures.push(`public geometry variable ${name} is unused`);
        if (!documentedPublicVariables.has(name)) {
            failures.push(`public component-variable documentation is missing ${name}`);
        }
    }

    return failures;
}

function verifyConsumerSources(consumerSources) {
    const failures = [];

    for (const { path, contents } of consumerSources) {
        if (contents.includes('--_rp-')) {
            failures.push(`${path} documents or consumes a private variable`);
        }
        if (/\.[a-z0-9_-]*rp-[a-z0-9_-]*/i.test(contents)) {
            failures.push(`${path} consumes an internal Ropav class selector`);
        }
    }

    return failures;
}

function formatValue(value) {
    return JSON.stringify(value);
}
