import { execFileSync } from 'node:child_process';

const manifestPath = 'src/styles/styles-manifest.json';
const releaseTagPattern = /^v\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;

export function resolveReleasedPublicStylesBaseline({
    projectRoot,
    baselineRef = process.env.PUBLIC_STYLES_BASELINE_REF,
}) {
    const explicitRef = baselineRef?.trim();
    const releaseTags = explicitRef ? [] : findReleaseTags(projectRoot);
    const ref =
        explicitRef || releaseTags.find((tag) => pathExistsAtRef(projectRoot, tag, manifestPath));
    if (!ref) {
        return {
            failure:
                'cannot resolve a released public styles baseline containing src/styles/styles-manifest.json; fetch release tags or set PUBLIC_STYLES_BASELINE_REF',
        };
    }

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
