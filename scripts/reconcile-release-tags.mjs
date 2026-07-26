import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export function decideReleaseTag({ head, localTagCommit, publishedGitHead, remoteTagCommit }) {
    if (publishedGitHead === undefined) return 'skip-unpublished';
    if (publishedGitHead !== head) return 'skip-other-commit';
    if (localTagCommit !== undefined && localTagCommit !== head) {
        throw new Error(`local tag points to ${localTagCommit}, expected ${head}`);
    }
    if (remoteTagCommit !== undefined && remoteTagCommit !== head) {
        throw new Error(`remote tag points to ${remoteTagCommit}, expected ${head}`);
    }
    if (remoteTagCommit !== undefined) return 'already-remote';
    if (localTagCommit !== undefined) return 'push-existing';
    return 'create';
}

export function reconcileReleaseTags(workspaceRoot, { remote = 'origin' } = {}) {
    const head = execGit(workspaceRoot, ['rev-parse', 'HEAD']);
    const packages = readPublishablePackages(workspaceRoot);
    const results = [];

    for (const packageRecord of packages) {
        const { name, version } = packageRecord;
        const tag = `${name}@${version}`;
        const publishedGitHead = readPublishedGitHead(packageRecord, workspaceRoot);
        const releaseMatchesHead = publishedGitHead === head;
        const localTagCommit = releaseMatchesHead
            ? readLocalTagCommit(workspaceRoot, tag)
            : undefined;
        const remoteTagCommit = releaseMatchesHead
            ? readRemoteTagCommit(workspaceRoot, remote, tag)
            : undefined;
        let action;
        try {
            action = decideReleaseTag({
                head,
                localTagCommit,
                publishedGitHead,
                remoteTagCommit,
            });
        } catch (error) {
            throw new Error(`${tag}: ${error.message}`, { cause: error });
        }

        if (action === 'create') createAnnotatedTag(workspaceRoot, tag, head);
        results.push({ action, tag });
    }

    return results;
}

function readPublishablePackages(workspaceRoot) {
    const packagesRoot = resolve(workspaceRoot, 'packages');
    if (!existsSync(packagesRoot)) return [];

    return readdirSync(packagesRoot, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .flatMap((entry) => {
            const manifestPath = resolve(packagesRoot, entry.name, 'package.json');
            if (!existsSync(manifestPath)) return [];

            const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
            if (manifest.private === true || !manifest.name || !manifest.version) return [];
            return [
                {
                    name: manifest.name,
                    registry: manifest.publishConfig?.registry,
                    version: manifest.version,
                },
            ];
        });
}

function readPublishedGitHead(packageRecord, workspaceRoot) {
    const specifier = `${packageRecord.name}@${packageRecord.version}`;
    const args = ['view', specifier, 'gitHead', '--json'];
    if (packageRecord.registry) args.push(`--registry=${packageRecord.registry}`);

    const result = spawnSync('npm', args, {
        cwd: workspaceRoot,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
    });
    if (result.status !== 0) {
        const output = `${result.stdout}\n${result.stderr}`;
        if (output.includes('E404')) return undefined;
        throw new Error(`cannot inspect ${specifier} on npm: ${output.trim()}`);
    }

    const output = result.stdout.trim();
    if (!output || output === 'null') {
        throw new Error(`${specifier} is published without gitHead metadata`);
    }

    const gitHead = JSON.parse(output);
    if (typeof gitHead !== 'string' || gitHead.length === 0) {
        throw new Error(`${specifier} has invalid gitHead metadata`);
    }
    return gitHead;
}

function readLocalTagCommit(workspaceRoot, tag) {
    try {
        return execGit(workspaceRoot, ['rev-parse', '--verify', `refs/tags/${tag}^{commit}`]);
    } catch {
        return undefined;
    }
}

function readRemoteTagCommit(workspaceRoot, remote, tag) {
    const result = execGit(workspaceRoot, [
        'ls-remote',
        '--tags',
        remote,
        `refs/tags/${tag}`,
        `refs/tags/${tag}^{}`,
    ]);
    const refs = result
        .split('\n')
        .map((line) => line.trim().split(/\s+/))
        .filter((parts) => parts.length === 2);
    const peeled = refs.find(([, ref]) => ref.endsWith('^{}'));
    return peeled?.[0] ?? refs[0]?.[0];
}

function createAnnotatedTag(workspaceRoot, tag, head) {
    execGit(workspaceRoot, [
        '-c',
        'user.name=github-actions[bot]',
        '-c',
        'user.email=41898282+github-actions[bot]@users.noreply.github.com',
        'tag',
        '-a',
        tag,
        '-m',
        `Release ${tag}`,
        head,
    ]);
}

function execGit(cwd, arguments_) {
    return execFileSync('git', arguments_, {
        cwd,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
}

function run() {
    const workspaceRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
    const results = reconcileReleaseTags(workspaceRoot);
    for (const { action, tag } of results) console.log(`${tag}: ${action}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) run();
