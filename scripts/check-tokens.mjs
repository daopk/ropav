import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import StyleDictionary from 'style-dictionary';
import {
    cssCustomProperty,
    hasCssCustomProperty,
    hasScssVariable,
    isPublicToken,
    scssName,
    tokenPath,
} from './token-output-policy.mjs';
import {
    colorNames,
    colorShades,
    contrastRatio,
    filledActiveColorPercent,
    getDerivedColorVariables,
    mixColors,
    oldSemanticColorVariables,
    parseHexColor,
    whiteContrastColorNames,
} from './color-system.mjs';
import {
    publicComponentVariableNames,
    publicComponentVariables,
} from './public-styles-contract.mjs';
import { checkReleasedPublicStylesCompatibility } from './public-styles-compatibility.mjs';

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
process.chdir(projectRoot);
const publicStylesManifest = JSON.parse(
    readFileSync(join(projectRoot, 'src/styles/styles-manifest.json'), 'utf8'),
);
const publicTokenDocs = readFileSync(join(projectRoot, 'docs/public-tokens.md'), 'utf8');
const documentedPublicVariables = new Set(
    [...publicTokenDocs.matchAll(/^\|\s+`(--rp-[^`]+)`\s+\|/gm)].map((match) => match[1]),
);

const {
    default: config,
    defaultDictionary,
    darkOverrideDictionary,
} = await import('./tokens.config.mjs');
const dictionary = new StyleDictionary(config, { verbosity: 'silent' });
await dictionary.hasInitialized;

const defaultTokenValues = collectDictionaryTokenValues(defaultDictionary);
const darkOverrideTokenValues = collectDictionaryTokenValues(darkOverrideDictionary);

const staleFiles = [];
const platformOutputs = await dictionary.formatAllPlatforms();

for (const outputs of Object.values(platformOutputs)) {
    for (const { destination, output } of outputs) {
        if (!destination || typeof output !== 'string') continue;

        const outputPath = join(projectRoot, destination);
        if (!existsSync(outputPath) || readFileSync(outputPath, 'utf8') !== output) {
            staleFiles.push(relative(projectRoot, outputPath));
        }
    }
}

if (staleFiles.length > 0) {
    console.error('Generated token files are out of date:');
    for (const file of staleFiles) {
        console.error(`- ${file}`);
    }
    console.error('Run `pnpm tokens:build` to update them.');
    process.exitCode = 1;
}

const tokenStructureFailures = [
    ...checkPaletteStructure(defaultTokenValues),
    ...checkUnknownThemeOverrides(defaultTokenValues, darkOverrideTokenValues),
    ...checkDuplicateOutputNames(dictionary),
    ...checkPublicTokenMetadata(dictionary),
    ...checkGeneratedCssCustomProperties(),
    ...checkPublicStylesManifest(),
    ...checkReleasedPublicStylesCompatibility({
        currentManifest: publicStylesManifest,
        projectRoot,
    }),
    ...checkPublicComponentVariables(),
    ...checkPublicDocumentationPatterns(),
];
if (tokenStructureFailures.length > 0) {
    console.error('Token structure checks failed:');
    for (const failure of tokenStructureFailures) {
        console.error(`- ${failure}`);
    }
    process.exitCode = 1;
}

const contrastFailures = [...checkThemeContrast('light'), ...checkThemeContrast('dark')];
if (contrastFailures.length > 0) {
    console.error('Token color contrast checks failed:');
    for (const failure of contrastFailures) {
        console.error(`- ${failure}`);
    }
    process.exitCode = 1;
}

function checkThemeContrast(themeName) {
    const cssValues = collectCssVariableValues(themeName);
    const failures = [];

    assertContrast(themeName, cssValues, failures, '--rp-color-text', '--rp-color-body', 4.5);
    for (const surface of ['--rp-color-body', '--rp-color-default', '--rp-color-default-hover']) {
        assertContrast(themeName, cssValues, failures, '--rp-color-dimmed', surface, 4.5);
    }
    assertContrast(
        themeName,
        cssValues,
        failures,
        '--rp-color-default-color',
        '--rp-color-default',
        4.5,
    );
    assertContrast(
        themeName,
        cssValues,
        failures,
        '--rp-color-control-fg',
        '--rp-color-control-bg',
        4.5,
    );
    assertContrast(
        themeName,
        cssValues,
        failures,
        '--rp-color-control-selected-fg',
        '--rp-color-control-selected-bg',
        4.5,
    );
    assertContrast(
        themeName,
        cssValues,
        failures,
        '--rp-primary-color-contrast',
        '--rp-primary-color-filled',
        4.5,
    );
    assertBestContrast(
        themeName,
        cssValues,
        failures,
        '--rp-primary-color-contrast',
        '--rp-primary-color-filled',
    );
    assertContrastValue(
        themeName,
        cssValues,
        failures,
        '--rp-primary-color-contrast',
        getActiveBackgroundValue('--rp-primary-color-filled'),
        '--rp-primary-color-filled active state',
        4.5,
    );

    for (const color of colorNames) {
        assertContrast(
            themeName,
            cssValues,
            failures,
            `--rp-color-${color}-contrast`,
            `--rp-color-${color}-filled`,
            4.5,
        );
        assertContrast(
            themeName,
            cssValues,
            failures,
            `--rp-color-${color}-contrast`,
            `--rp-color-${color}-filled-hover`,
            4.5,
        );
        assertContrastValue(
            themeName,
            cssValues,
            failures,
            `--rp-color-${color}-contrast`,
            getActiveBackgroundValue(`--rp-color-${color}-filled`),
            `--rp-color-${color}-filled active state`,
            4.5,
        );
        if (whiteContrastColorNames.includes(color)) {
            assertSameResolvedColor(
                themeName,
                cssValues,
                failures,
                `--rp-color-${color}-contrast`,
                '--rp-color-white',
            );
        } else {
            assertBestContrast(
                themeName,
                cssValues,
                failures,
                `--rp-color-${color}-contrast`,
                `--rp-color-${color}-filled`,
            );
        }

        for (const shade of colorShades) {
            const hoverShade = Math.min(Number(shade) + 1, 9);

            assertContrast(
                themeName,
                cssValues,
                failures,
                `--rp-color-${color}-${shade}-contrast`,
                `--rp-color-${color}-${shade}`,
                4.5,
            );
            assertContrastValue(
                themeName,
                cssValues,
                failures,
                `--rp-color-${color}-${hoverShade}-contrast`,
                `var(--rp-color-${color}-${hoverShade})`,
                `--rp-color-${color}-${shade} hover state`,
                4.5,
            );
            assertContrastValue(
                themeName,
                cssValues,
                failures,
                `--rp-color-${color}-${shade}-active-contrast`,
                getActiveBackgroundValue(`--rp-color-${color}-${shade}`),
                `--rp-color-${color}-${shade} active state`,
                4.5,
            );
            assertBestContrast(
                themeName,
                cssValues,
                failures,
                `--rp-color-${color}-${shade}-contrast`,
                `--rp-color-${color}-${shade}`,
            );
        }
    }

    return failures;
}

function checkPaletteStructure(tokenValues) {
    const failures = [];

    for (const color of colorNames) {
        for (const shade of colorShades) {
            const path = `color.${color}.${shade}`;
            if (!tokenValues.has(path)) {
                failures.push(`palette color ${color} is missing shade ${shade}`);
            }
        }

        for (const path of tokenValues.keys()) {
            if (path.startsWith(`color.${color}.`)) {
                const shade = path.slice(`color.${color}.`.length);
                if (!colorShades.includes(shade)) {
                    failures.push(`palette color ${color} has unsupported shade ${shade}`);
                }
            }
        }
    }

    for (const color of ['white', 'black']) {
        if (!tokenValues.has(`color.${color}`)) {
            failures.push(`core color ${color} is missing`);
        }
    }

    return failures;
}

function checkUnknownThemeOverrides(defaultValues, overrideValues) {
    const failures = [];

    for (const path of overrideValues.keys()) {
        if (!defaultValues.has(path)) {
            failures.push(`dark override ${path} does not exist in default tokens`);
        }
    }

    return failures;
}

function checkDuplicateOutputNames(tokenDictionary) {
    const failures = [];
    assertUniqueTokenNames(
        'CSS custom property',
        tokenDictionary.allTokens.filter(hasCssCustomProperty),
        cssCustomProperty,
        failures,
    );
    assertUniqueTokenNames(
        'Sass variable',
        tokenDictionary.allTokens.filter(hasScssVariable),
        (token) => `$${scssName(token)}`,
        failures,
    );

    return failures;
}

function checkPublicTokenMetadata(tokenDictionary) {
    const failures = [];

    for (const token of tokenDictionary.allTokens.filter(isPublicToken)) {
        if (!hasCssCustomProperty(token)) {
            failures.push(
                `public token ${tokenPathString(token)} must also emit a CSS custom property`,
            );
        }
    }

    return failures;
}

function checkGeneratedCssCustomProperties() {
    const tokenCss = readFileSync(join(projectRoot, 'src/styles/_tokens.scss'), 'utf8');
    const generatedNames = new Set();
    const failures = [];

    for (const [, name] of tokenCss.matchAll(/^\s+(--rp-[a-z0-9-]+)\s*:/gim)) {
        generatedNames.add(name);

        if (oldSemanticColorVariables.has(name)) {
            failures.push(`old semantic CSS custom property ${name} was generated`);
            continue;
        }
    }

    const manifestNames = new Set((publicStylesManifest.tokens ?? []).map(({ name }) => name));
    for (const name of manifestNames) {
        if (!generatedNames.has(name)) {
            failures.push(`manifest token ${name} is not generated`);
        }
    }
    return failures;
}

function checkPublicStylesManifest() {
    const failures = [];
    const seen = new Set();

    if (publicStylesManifest.schemaVersion !== 1) {
        failures.push('public styles manifest has an unsupported schemaVersion');
    }
    if (!Number.isSafeInteger(publicStylesManifest.contractVersion)) {
        failures.push('public styles manifest has an invalid contractVersion');
    }
    if (publicStylesManifest.baseline !== '5102a40') {
        failures.push('public styles manifest baseline must remain 5102a40 for this rollout');
    }

    for (const token of publicStylesManifest.tokens ?? []) {
        for (const field of [
            'name',
            'sourcePath',
            'type',
            'category',
            'description',
            'themeApplicability',
        ]) {
            if (!token[field])
                failures.push(`manifest token ${token.name ?? '<unknown>'} misses ${field}`);
        }
        if (seen.has(token.name)) failures.push(`manifest contains duplicate token ${token.name}`);
        seen.add(token.name);
        if (!documentedPublicVariables.has(token.name)) {
            failures.push(`public token documentation is missing ${token.name}`);
        }
    }

    const expectedDocumentedNames = new Set([
        ...(publicStylesManifest.tokens ?? []).map(({ name }) => name),
        ...publicComponentVariableNames,
    ]);
    for (const name of documentedPublicVariables) {
        if (!expectedDocumentedNames.has(name)) {
            failures.push(`public token documentation contains non-manifest variable ${name}`);
        }
    }

    return failures;
}

function checkPublicComponentVariables() {
    const failures = [];
    const manifestNames = new Set(
        (publicStylesManifest.componentVariables ?? []).map(({ name }) => name),
    );
    if (
        manifestNames.size !== publicComponentVariableNames.size ||
        [...publicComponentVariableNames].some((name) => !manifestNames.has(name))
    ) {
        failures.push('manifest componentVariables do not match the public geometry allowlist');
    }

    const componentSources = collectFiles(join(projectRoot, 'src/components'))
        .filter((file) => /\.(?:scss|ts|vue)$/.test(file))
        .map((file) => readFileSync(file, 'utf8'))
        .join('\n');
    const geometryNames = new Set(
        componentSources.match(/--rp-(?:switch|slider|radio)-[a-z0-9-]+/g) ?? [],
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

function checkPublicDocumentationPatterns() {
    const failures = [];
    const roots = ['docs', 'examples', 'tests/fixtures/consumer-app/src'].map((path) =>
        join(projectRoot, path),
    );
    for (const root of roots) {
        if (!existsSync(root)) continue;
        for (const file of collectFiles(root)) {
            if (!/\.(?:css|html|js|json|md|scss|ts|tsx|vue)$/.test(file)) continue;
            const contents = readFileSync(file, 'utf8');
            if (contents.includes('--_rp-')) {
                failures.push(
                    `${relative(projectRoot, file)} documents or consumes a private variable`,
                );
            }
            if (/\.[a-z0-9_-]*rp-[a-z0-9_-]*/i.test(contents)) {
                failures.push(
                    `${relative(projectRoot, file)} consumes an internal Ropav class selector`,
                );
            }
        }
    }
    return failures;
}

function collectFiles(root) {
    if (!existsSync(root)) return [];
    if (!statSync(root).isDirectory()) return [root];
    return readdirSync(root).flatMap((entry) => collectFiles(join(root, entry)));
}

function assertUniqueTokenNames(nameKind, tokens, getName, failures) {
    const seen = new Map();
    for (const token of tokens) {
        const name = getName(token);
        const path = tokenPathString(token);
        const previousPath = seen.get(name);
        if (previousPath) {
            failures.push(`${nameKind} ${name} is emitted by both ${previousPath} and ${path}`);
            continue;
        }

        seen.set(name, path);
    }
}

function collectDictionaryTokenValues(tokenDictionary) {
    return new Map(
        tokenDictionary.allTokens.map((token) => [tokenPathString(token), tokenValue(token)]),
    );
}

function tokenValue(token) {
    return token.original?.$value ?? token.$value;
}

function collectCssVariableValues(themeName) {
    const values = new Map();

    for (const token of dictionary.allTokens.filter(hasCssCustomProperty)) {
        values.set(cssCustomProperty(token), tokenValue(token));
    }

    for (const [name, value] of Object.entries(getDerivedColorVariables('light'))) {
        values.set(name, value);
    }

    if (themeName === 'dark') {
        for (const [name, value] of Object.entries(getDerivedColorVariables('dark'))) {
            values.set(name, value);
        }
    }

    return values;
}

function assertContrast(themeName, cssValues, failures, foregroundName, backgroundName, minRatio) {
    const foreground = resolveCssColor(cssValues, foregroundName);
    const background = resolveCssColor(cssValues, backgroundName);
    if (!isOpaqueColor(foreground) || !isOpaqueColor(background)) {
        failures.push(
            `${themeName}: ${foregroundName} on ${backgroundName} could not be resolved to opaque colors`,
        );
        return;
    }

    const ratio = contrastRatio(foreground, background);
    if (ratio < minRatio) {
        failures.push(
            `${themeName}: ${foregroundName} on ${backgroundName} is ${ratio.toFixed(2)}:1, expected at least ${minRatio}:1`,
        );
    }
}

function assertContrastValue(
    themeName,
    cssValues,
    failures,
    foregroundName,
    backgroundValue,
    backgroundLabel,
    minRatio,
) {
    const foreground = resolveCssColor(cssValues, foregroundName);
    const background = resolveCssColorValue(cssValues, backgroundValue, new Set());
    if (!isOpaqueColor(foreground) || !isOpaqueColor(background)) {
        failures.push(
            `${themeName}: ${foregroundName} on ${backgroundLabel} could not be resolved to opaque colors`,
        );
        return;
    }

    const ratio = contrastRatio(foreground, background);
    if (ratio < minRatio) {
        failures.push(
            `${themeName}: ${foregroundName} on ${backgroundLabel} is ${ratio.toFixed(2)}:1, expected at least ${minRatio}:1`,
        );
    }
}

function getActiveBackgroundValue(backgroundName) {
    return `color-mix(in srgb, var(${backgroundName}) ${filledActiveColorPercent}%, var(--rp-color-black))`;
}

function assertBestContrast(themeName, cssValues, failures, foregroundName, backgroundName) {
    const foreground = resolveCssColor(cssValues, foregroundName);
    const background = resolveCssColor(cssValues, backgroundName);
    const black = resolveCssColor(cssValues, '--rp-color-black');
    const white = resolveCssColor(cssValues, '--rp-color-white');

    if (
        !isOpaqueColor(foreground) ||
        !isOpaqueColor(background) ||
        !isOpaqueColor(black) ||
        !isOpaqueColor(white)
    ) {
        failures.push(
            `${themeName}: ${foregroundName} on ${backgroundName} could not be resolved for contrast selection`,
        );
        return;
    }

    const blackRatio = contrastRatio(black, background);
    const whiteRatio = contrastRatio(white, background);
    const expected = blackRatio >= whiteRatio ? black : white;

    if (!sameColor(foreground, expected)) {
        const expectedName = blackRatio >= whiteRatio ? '--rp-color-black' : '--rp-color-white';
        failures.push(
            `${themeName}: ${foregroundName} on ${backgroundName} should resolve to ${expectedName}`,
        );
    }
}

function assertSameResolvedColor(themeName, cssValues, failures, actualName, expectedName) {
    const actual = resolveCssColor(cssValues, actualName);
    const expected = resolveCssColor(cssValues, expectedName);
    if (!isOpaqueColor(actual) || !isOpaqueColor(expected)) {
        failures.push(`${themeName}: ${actualName} or ${expectedName} could not be resolved`);
        return;
    }

    if (!sameColor(actual, expected)) {
        failures.push(`${themeName}: ${actualName} should resolve to ${expectedName}`);
    }
}

function resolveCssColor(cssValues, name, seen = new Set()) {
    if (seen.has(name)) return undefined;
    seen.add(name);

    const value = cssValues.get(name);
    if (typeof value !== 'string') return undefined;

    return resolveCssColorValue(cssValues, value, seen);
}

function resolveCssColorValue(cssValues, value, seen) {
    const trimmedValue = value.trim();

    const reference = trimmedValue.match(/^\{([^}]+)\}$/);
    if (reference) {
        const referenceToken = dictionary.tokenMap.get(`{${normalizeReferencePath(reference[1])}}`);
        if (!referenceToken || !hasCssCustomProperty(referenceToken)) return undefined;

        return resolveCssColor(cssValues, cssCustomProperty(referenceToken), seen);
    }

    const cssVariable = trimmedValue.match(/^var\((--rp-[a-z0-9-]+)\)$/i);
    if (cssVariable) return resolveCssColor(cssValues, cssVariable[1], seen);

    const hex = trimmedValue.match(/^#(?:[\da-f]{3}|[\da-f]{6})$/i);
    if (hex) return parseHexColor(trimmedValue);

    if (trimmedValue.toLowerCase() === 'transparent') {
        return { red: 0, green: 0, blue: 0, alpha: 0 };
    }

    const colorMix = trimmedValue.match(
        /^color-mix\(in\s+srgb,\s*(.+?)\s+(\d+(?:\.\d+)?)%,\s*(.+?)\)$/i,
    );
    if (colorMix) {
        const [, firstValue, firstWeight, secondValue] = colorMix;
        const firstColor = resolveCssColorValue(cssValues, firstValue, new Set(seen));
        const secondColor = resolveCssColorValue(cssValues, secondValue, new Set(seen));
        if (!firstColor || !secondColor) return undefined;

        return mixColors(firstColor, Number.parseFloat(firstWeight) / 100, secondColor);
    }

    return undefined;
}

function normalizeReferencePath(path) {
    return path.replace(/\.\$?value$/, '');
}

function isOpaqueColor(color) {
    return color && color.alpha === 1;
}

function sameColor(first, second) {
    return (
        first.red === second.red &&
        first.green === second.green &&
        first.blue === second.blue &&
        first.alpha === second.alpha
    );
}

function tokenPathString(token) {
    return tokenPath(token).join('.');
}
