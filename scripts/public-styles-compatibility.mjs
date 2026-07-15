import { execFileSync } from 'node:child_process';

const manifestPath = 'src/styles/styles-manifest.json';
const bootstrapManifestRef = 'f2f7a815b6699365f0f47c114f74207877218f33';
const releaseTagPattern = /^v\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;

const tokenSemanticFields = ['sourcePath', 'type', 'category', 'themeApplicability'];
const componentVariableSemanticFields = ['component', 'acceptedValue', 'fallback'];

export function checkReleasedPublicStylesCompatibility({
    currentManifest,
    projectRoot,
    baselineRef = process.env.PUBLIC_STYLES_BASELINE_REF,
}) {
    const resolvedBaseline = resolveReleasedManifest({ projectRoot, baselineRef });
    if (resolvedBaseline.failure) return [resolvedBaseline.failure];

    return comparePublicStylesManifests(resolvedBaseline.manifest, currentManifest, {
        baselineRef: resolvedBaseline.ref,
    });
}

export function comparePublicStylesManifests(
    releasedManifest,
    currentManifest,
    { baselineRef = 'released baseline' } = {},
) {
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
    const releasedByName = indexEntries(releasedEntries);
    const currentByName = indexEntries(currentEntries);

    for (const [name, releasedEntry] of releasedByName) {
        const currentEntry = currentByName.get(name);
        if (!currentEntry) {
            failures.push(`${baselineRef} stable ${kind} ${name} was removed or renamed`);
            continue;
        }

        for (const field of semanticFields) {
            if (!sameValue(releasedEntry[field], currentEntry[field])) {
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

function indexEntries(entries) {
    return new Map(entries.map((entry) => [entry.name, entry]));
}

function sameValue(left, right) {
    return JSON.stringify(left) === JSON.stringify(right);
}

function formatValue(value) {
    return JSON.stringify(value);
}

function resolveReleasedManifest({ projectRoot, baselineRef }) {
    const explicitRef = baselineRef?.trim();
    const releaseTags = explicitRef ? [] : findReleaseTags(projectRoot);
    if (!explicitRef && releaseTags.length === 0) {
        return {
            failure:
                'cannot resolve a released public styles baseline; fetch release tags or set PUBLIC_STYLES_BASELINE_REF',
        };
    }

    const ref =
        explicitRef ||
        releaseTags.find((tag) => pathExistsAtRef(projectRoot, tag, manifestPath)) ||
        bootstrapManifestRef;

    try {
        execGit(projectRoot, ['rev-parse', '--verify', `${ref}^{commit}`]);
    } catch {
        return { failure: `public styles baseline ref ${ref} does not resolve to a commit` };
    }

    if (!pathExistsAtRef(projectRoot, ref, manifestPath)) {
        return {
            failure: `public styles baseline ref ${ref} is missing ${manifestPath}`,
        };
    }

    try {
        return {
            ref,
            manifest: JSON.parse(execGit(projectRoot, ['show', `${ref}:${manifestPath}`])),
        };
    } catch (error) {
        return {
            failure: `cannot read a valid public styles manifest from baseline ref ${ref}: ${error.message}`,
        };
    }
}

function findReleaseTags(projectRoot) {
    let tags;
    try {
        tags = execGit(projectRoot, ['tag', '--merged', 'HEAD', '--sort=-version:refname']).split(
            '\n',
        );
    } catch {
        return [];
    }

    return tags.map((tag) => tag.trim()).filter((tag) => releaseTagPattern.test(tag));
}

function pathExistsAtRef(projectRoot, ref, path) {
    try {
        execGit(projectRoot, ['cat-file', '-e', `${ref}:${path}`]);
        return true;
    } catch {
        return false;
    }
}

function execGit(projectRoot, arguments_) {
    return execFileSync('git', arguments_, {
        cwd: projectRoot,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
}
