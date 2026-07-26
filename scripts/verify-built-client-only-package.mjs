import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, realpathSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export async function verifyBuiltClientOnlyPackage({ packageRoot, policy }) {
    assertPolicy(policy);

    const resolvedPackageRoot = resolve(packageRoot);
    const manifest = readManifest(resolvedPackageRoot);
    const outputTargets = readOutputTargets(manifest);
    for (const target of outputTargets) {
        const outputFile = resolve(resolvedPackageRoot, target);
        if (!existsSync(outputFile)) throw new Error(`Missing package output: ${target}`);
    }

    const rootExport = manifest.exports?.['.'];
    const clientTarget = readConditionalTarget(rootExport, ['browser', 'import', 'default']);
    if (!clientTarget) {
        throw new Error(`${manifest.name} must define a browser or import package export`);
    }
    const nodeTarget = readConditionalTarget(rootExport, ['node'], ['node', 'import', 'default']);
    if (!nodeTarget) throw new Error(`${manifest.name} must define a Node package export`);

    const clientJavaScript = readOutput(resolvedPackageRoot, clientTarget);
    await policy.verifyPackageOutput({
        clientJavaScript,
        readExport: (subpath) => {
            const target = readConditionalTarget(manifest.exports?.[subpath], [
                'browser',
                'import',
                'default',
            ]);
            if (!target) throw new Error(`${manifest.name} does not export ${subpath}`);
            return readOutput(resolvedPackageRoot, target);
        },
    });

    const nodeEntry = resolve(resolvedPackageRoot, nodeTarget);
    const nodeClosure = readJavaScriptClosure(nodeEntry);
    assertNodeClosureIsServerSafe(nodeClosure, policy.nodeClientMarkers);

    const resolvedNodeEntry = resolveEsmSelf(manifest.name, resolvedPackageRoot);
    if (realpathSync(resolvedNodeEntry) !== realpathSync(nodeEntry)) {
        throw new Error(
            `Node self-resolution selected ${resolvedNodeEntry} instead of ${nodeEntry}`,
        );
    }

    const nodeModule = await import(pathToFileURL(resolvedNodeEntry).href);
    policy.assertNodeInterface(nodeModule, 'Node export condition');

    const legacyRequire = createRequire(resolve(resolvedPackageRoot, 'package.json'));
    const resolvedMainEntry = legacyRequire.resolve(resolvedPackageRoot);
    if (realpathSync(resolvedMainEntry) !== realpathSync(nodeEntry)) {
        throw new Error(`Legacy main selected ${resolvedMainEntry} instead of ${nodeEntry}`);
    }
    policy.assertNodeInterface(legacyRequire(resolvedPackageRoot), 'Legacy main');

    await assertClientOnlyGuard(manifest.name, nodeModule, policy.invokeServerRender);
}

function assertPolicy(policy) {
    if (
        !policy ||
        !Array.isArray(policy.nodeClientMarkers) ||
        typeof policy.assertNodeInterface !== 'function' ||
        typeof policy.invokeServerRender !== 'function' ||
        typeof policy.verifyPackageOutput !== 'function'
    ) {
        throw new TypeError('Client-only package verification requires a complete package policy');
    }
}

function readManifest(packageRoot) {
    return JSON.parse(readFileSync(resolve(packageRoot, 'package.json'), 'utf8'));
}

function readOutputTargets(manifest) {
    const targets = new Set();
    for (const field of ['main', 'module', 'browser', 'types']) {
        collectOutputTargets(manifest[field], targets);
    }
    collectOutputTargets(manifest.exports, targets);
    return targets;
}

function collectOutputTargets(value, targets) {
    if (typeof value === 'string') {
        if (value.startsWith('.') && !value.includes('*')) targets.add(value);
        return;
    }
    if (Array.isArray(value)) {
        for (const item of value) collectOutputTargets(item, targets);
        return;
    }
    if (!value || typeof value !== 'object') return;
    for (const item of Object.values(value)) collectOutputTargets(item, targets);
}

function readConditionalTarget(value, conditions, nestedConditions = conditions) {
    return readTarget(value, conditions);

    function readTarget(candidate, candidateConditions) {
        if (typeof candidate === 'string') return candidate;
        if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) {
            return undefined;
        }
        for (const condition of candidateConditions) {
            const target = readTarget(candidate[condition], nestedConditions);
            if (target) return target;
        }
        return undefined;
    }
}

function readOutput(packageRoot, target) {
    return readFileSync(resolve(packageRoot, target), 'utf8');
}

function readJavaScriptClosure(entry) {
    const modules = new Map();
    const pending = [entry];

    while (pending.length > 0) {
        const file = pending.pop();
        if (!file || modules.has(file)) continue;

        const source = readFileSync(file, 'utf8');
        modules.set(file, source);
        for (const specifier of readRelativeModuleSpecifiers(source)) {
            const dependency = resolve(dirname(file), specifier);
            if (!existsSync(dependency)) {
                throw new Error(`Missing Node entry dependency: ${dependency}`);
            }
            pending.push(dependency);
        }
    }

    return modules;
}

function readRelativeModuleSpecifiers(source) {
    const staticImports = source.matchAll(
        /\b(?:import|export)\s+(?:[^'"]*?\s+from\s+)?["'](\.[^"']+)["']/g,
    );
    const dynamicImports = source.matchAll(/\bimport\s*\(\s*["'](\.[^"']+)["']\s*\)/g);
    const requires = source.matchAll(/\brequire\s*\(\s*["'](\.[^"']+)["']\s*\)/g);
    return new Set(
        [...staticImports, ...dynamicImports, ...requires]
            .map((match) => match[1])
            .filter((specifier) => specifier !== undefined),
    );
}

function assertNodeClosureIsServerSafe(nodeClosure, forbiddenMarkers) {
    for (const [file, source] of nodeClosure) {
        for (const marker of forbiddenMarkers) {
            if (source.includes(marker)) {
                throw new Error(`${file} includes client-only marker: ${marker}`);
            }
        }
    }
}

function resolveEsmSelf(packageName, packageRoot) {
    const source = `process.stdout.write(import.meta.resolve(${JSON.stringify(packageName)}))`;
    let resolvedEntry;
    try {
        resolvedEntry = execFileSync(process.execPath, ['--input-type=module', '--eval', source], {
            cwd: packageRoot,
            encoding: 'utf8',
            stdio: ['ignore', 'pipe', 'pipe'],
        });
    } catch (error) {
        const detail = error.stderr?.trim() || error.message;
        throw new Error(`Unable to resolve ${packageName} from its package root: ${detail}`, {
            cause: error,
        });
    }
    return fileURLToPath(resolvedEntry.trim());
}

async function assertClientOnlyGuard(packageName, nodeModule, invokeServerRender) {
    try {
        await invokeServerRender(nodeModule);
    } catch (error) {
        if (error instanceof Error && error.message.includes('client-only')) return;
        throw error;
    }
    throw new Error(`${packageName} Node guard did not reject server rendering as client-only`);
}
