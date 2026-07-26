import { execFileSync } from 'node:child_process';

const currentManifestPath = 'packages/ropav/src/styles/styles-manifest.json';
const legacyManifestPath = 'src/styles/styles-manifest.json';
const manifestPaths = [currentManifestPath, legacyManifestPath];
const packageReleaseTagPattern = /^ropav@\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;
const legacyReleaseTagPattern = /^v\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;

export function resolveReleasedPublicStylesBaseline({
    projectRoot,
    baselineRef = process.env.PUBLIC_STYLES_BASELINE_REF,
}) {
    const repositoryRoot = findRepositoryRoot(projectRoot);
    const explicitRef = baselineRef?.trim();

    if (explicitRef) return readBaseline(repositoryRoot, explicitRef);

    const candidate = findReleaseTags(repositoryRoot)
        .map((ref) => ({ ref, manifestPath: findManifestPath(repositoryRoot, ref) }))
        .find(({ manifestPath }) => manifestPath);
    if (!candidate) {
        return {
            failure:
                `cannot resolve a released public styles baseline containing ${currentManifestPath} ` +
                `or legacy ${legacyManifestPath}; fetch release tags or set PUBLIC_STYLES_BASELINE_REF`,
        };
    }

    return readBaseline(repositoryRoot, candidate.ref, candidate.manifestPath);
}

function readBaseline(repositoryRoot, ref, knownManifestPath) {
    try {
        execGit(repositoryRoot, ['rev-parse', '--verify', `${ref}^{commit}`]);
    } catch {
        return { failure: `public styles baseline ref ${ref} does not resolve to a commit` };
    }

    const manifestPath = knownManifestPath || findManifestPath(repositoryRoot, ref);
    if (!manifestPath) {
        return {
            failure:
                `public styles baseline ref ${ref} is missing ${currentManifestPath} ` +
                `and legacy ${legacyManifestPath}`,
        };
    }

    try {
        return {
            ref,
            manifest: JSON.parse(execGit(repositoryRoot, ['show', `${ref}:${manifestPath}`])),
        };
    } catch (error) {
        return {
            failure: `cannot read a valid public styles manifest from baseline ref ${ref}: ${error.message}`,
        };
    }
}

function findRepositoryRoot(projectRoot) {
    try {
        return execGit(projectRoot, ['rev-parse', '--show-toplevel']);
    } catch {
        return projectRoot;
    }
}

function findReleaseTags(repositoryRoot) {
    let tags;
    try {
        tags = execGit(repositoryRoot, [
            'tag',
            '--merged',
            'HEAD',
            '--sort=-version:refname',
        ]).split('\n');
    } catch {
        return [];
    }

    const normalizedTags = tags.map((tag) => tag.trim()).filter(Boolean);
    return [
        ...normalizedTags.filter((tag) => packageReleaseTagPattern.test(tag)),
        ...normalizedTags.filter((tag) => legacyReleaseTagPattern.test(tag)),
    ];
}

function findManifestPath(repositoryRoot, ref) {
    return manifestPaths.find((path) => pathExistsAtRef(repositoryRoot, ref, path));
}

function pathExistsAtRef(repositoryRoot, ref, path) {
    try {
        execGit(repositoryRoot, ['cat-file', '-e', `${ref}:${path}`]);
        return true;
    } catch {
        return false;
    }
}

function execGit(cwd, arguments_) {
    return execFileSync('git', arguments_, {
        cwd,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
}
