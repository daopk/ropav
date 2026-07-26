import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, extname, parse as parsePath, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { parse as parseVueSfc } from '@vue/compiler-sfc';
import ts from 'typescript';

const dependencyFields = [
    'dependencies',
    'devDependencies',
    'optionalDependencies',
    'peerDependencies',
];
const forbiddenLocalModuleNames = new Set(['core', 'helpers', 'utils']);
const jsxSourceExtensions = new Set(['.jsx', '.tsx']);
const productionSourceExtensions = new Set(['.js', '.jsx', '.ts', '.tsx', '.vue']);
const testOrStoryPattern = /\.(?:spec|story|stories|test)\.(?:js|jsx|ts|tsx|vue)$/;
const vdomPatterns = [
    /\bdefineComponent\s*\(/,
    /\bh\s*\(/,
    /\bVNode\b/,
    /\bcreateVNode\b/,
    /\bcloneVNode\b/,
    /\bisVNode\b/,
    /\bopenBlock\b/,
    /\bcreateBlock\b/,
    /\bcreateElementBlock\b/,
];
const bundleVdomPatterns = vdomPatterns.filter(
    (pattern) => pattern.source !== String.raw`\bh\s*\(`,
);
const layerRules = [
    {
        directory: 'utils',
        forbiddenDependencies: new Set(['components', 'composables', 'internal']),
    },
    {
        directory: 'composables',
        forbiddenDependencies: new Set(['components', 'internal']),
    },
    {
        directory: 'internal',
        forbiddenDependencies: new Set(['components']),
    },
];
const workspaceDependencyPolicy = new Map([
    ['ropav', new Set()],
    ['@ropav/editor', new Set(['ropav'])],
]);

export function verifyWorkspaceContracts(workspaceRoot) {
    const packageRecords = readWorkspacePackages(workspaceRoot);
    const packageNames = new Set(packageRecords.map(({ manifest }) => manifest.name));
    const violations = packageRecords.flatMap((packageRecord) =>
        verifyPackageManifest(packageRecord, packageNames).concat(
            verifyPackageSource(packageRecord, packageNames),
        ),
    );

    return [...new Set(violations)].toSorted();
}

export function verifyWorkspaceBundles(workspaceRoot) {
    const packageRecords = readWorkspacePackages(workspaceRoot);
    const violations = packageRecords.flatMap(({ manifest, packageRoot }) => {
        if (manifest.private === true) return [];

        const distRoot = resolve(packageRoot, 'dist');
        if (!existsSync(distRoot)) {
            return [`${manifest.name}: scripts.verify must produce a dist directory`];
        }

        return getFiles(distRoot)
            .filter((file) => ['.cjs', '.js', '.mjs'].includes(extname(file)))
            .flatMap((file) => {
                const source = readFileSync(file, 'utf8');
                const relativeFile = toPosixRelativePath(packageRoot, file);
                const fileViolations = [];
                if (source.includes('@tiptap/vue-3')) {
                    fileViolations.push(
                        `${manifest.name}/${relativeFile}: built output references @tiptap/vue-3`,
                    );
                }
                for (const pattern of bundleVdomPatterns) {
                    if (pattern.test(source)) {
                        fileViolations.push(
                            `${manifest.name}/${relativeFile}: built output matches forbidden VDOM pattern ${pattern.source}`,
                        );
                    }
                }
                return fileViolations;
            });
    });

    return [...new Set(violations)].toSorted();
}

function readWorkspacePackages(workspaceRoot) {
    const packagesRoot = resolve(workspaceRoot, 'packages');
    if (!existsSync(packagesRoot)) return [];

    return readdirSync(packagesRoot, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .flatMap((entry) => {
            const packageRoot = resolve(packagesRoot, entry.name);
            const manifestPath = resolve(packageRoot, 'package.json');
            if (!existsSync(manifestPath)) return [];

            return [
                {
                    manifest: JSON.parse(readFileSync(manifestPath, 'utf8')),
                    packageRoot,
                    sourceRoot: resolve(packageRoot, 'src'),
                },
            ];
        });
}

function verifyPackageManifest(packageRecord, packageNames) {
    const { manifest } = packageRecord;
    const violations = [];
    if (manifest.private === true) return violations;

    if (!manifest.scripts?.verify) {
        violations.push(`${manifest.name}: publishable packages must define scripts.verify`);
    }

    const allowedDependencies = workspaceDependencyPolicy.get(manifest.name);
    if (!allowedDependencies) {
        violations.push(
            `${manifest.name}: publishable package is missing a workspace dependency policy`,
        );
    }

    for (const field of dependencyFields) {
        for (const [dependency, range] of Object.entries(manifest[field] ?? {})) {
            if (dependency === '@tiptap/vue-3') {
                violations.push(
                    `${manifest.name}: ${field} must use @tiptap/core instead of @tiptap/vue-3`,
                );
            }
            if (!packageNames.has(dependency)) continue;

            if (typeof range !== 'string' || !range.startsWith('workspace:')) {
                violations.push(
                    `${manifest.name}: internal dependency ${dependency} in ${field} must use the workspace: protocol`,
                );
            }
            if (!allowedDependencies?.has(dependency)) {
                violations.push(
                    `${manifest.name}: workspace dependency ${dependency} violates the declared package direction`,
                );
            }
        }
    }

    return violations;
}

function verifyPackageSource(packageRecord, packageNames) {
    const { manifest, packageRoot, sourceRoot } = packageRecord;
    if (manifest.private === true || !existsSync(sourceRoot)) return [];

    const productionFiles = getFiles(sourceRoot).filter(isProductionSourceFile);
    const violations = [
        ...verifyComponentHelperPlacement(manifest.name, sourceRoot),
        ...verifyLayerDependencies(manifest.name, sourceRoot),
    ];

    for (const file of productionFiles) {
        const relativeFile = toPosixRelativePath(sourceRoot, file);
        const extension = extname(file);
        if (jsxSourceExtensions.has(extension)) {
            violations.push(`${manifest.name}/${relativeFile}: production JSX is not allowed`);
        }

        const moduleSource = readModuleSource(file, violations, manifest.name, relativeFile);
        for (const pattern of vdomPatterns) {
            if (pattern.test(moduleSource)) {
                violations.push(
                    `${manifest.name}/${relativeFile}: production source matches forbidden VDOM pattern ${pattern.source}`,
                );
            }
        }

        const specifiers = getModuleSpecifiers(moduleSource, file);
        violations.push(
            ...verifyModuleSpecifiers({
                file,
                manifest,
                packageNames,
                packageRoot,
                relativeFile,
                specifiers,
            }),
        );
    }

    return violations;
}

function readModuleSource(file, violations, packageName, relativeFile) {
    const source = readFileSync(file, 'utf8');
    if (extname(file) !== '.vue') return source;

    const result = parseVueSfc(source, { filename: file });
    if (result.errors.length > 0) {
        violations.push(`${packageName}/${relativeFile}: Vue SFC cannot be parsed`);
        return '';
    }

    const { script, scriptSetup } = result.descriptor;
    if (!scriptSetup || !Object.hasOwn(scriptSetup.attrs, 'vapor')) {
        violations.push(
            `${packageName}/${relativeFile}: production Vue SFC must use <script setup vapor>`,
        );
    }
    if (hasJsxLanguage(script) || hasJsxLanguage(scriptSetup)) {
        violations.push(`${packageName}/${relativeFile}: Vue scripts must not use JSX or TSX`);
    }

    return [script, scriptSetup]
        .filter((block) => block !== null)
        .map((block) => block.content)
        .join('\n');
}

function verifyModuleSpecifiers({
    file,
    manifest,
    packageNames,
    packageRoot,
    relativeFile,
    specifiers,
}) {
    const violations = [];
    const allowedDependencies = workspaceDependencyPolicy.get(manifest.name);
    const declaredDependencies = new Set(
        dependencyFields.flatMap((field) => Object.keys(manifest[field] ?? {})),
    );

    for (const specifier of specifiers) {
        if (specifier === '@tiptap/vue-3' || specifier.startsWith('@tiptap/vue-3/')) {
            violations.push(
                `${manifest.name}/${relativeFile}: import ${JSON.stringify(specifier)} violates the zero-VDOM Tiptap contract`,
            );
        }

        if (specifier.startsWith('.')) {
            const target = resolve(dirname(file), specifier);
            const relativeTarget = relative(packageRoot, target);
            if (relativeTarget === '..' || relativeTarget.startsWith(`..${pathSeparator()}`)) {
                violations.push(
                    `${manifest.name}/${relativeFile}: relative import ${JSON.stringify(specifier)} crosses a package seam`,
                );
            }
        }

        const dependency = findWorkspaceDependency(specifier, packageNames);
        if (!dependency || dependency === manifest.name) continue;
        if (specifier === `${dependency}/src` || specifier.startsWith(`${dependency}/src/`)) {
            violations.push(
                `${manifest.name}/${relativeFile}: import ${JSON.stringify(specifier)} reaches into another package's source`,
            );
        }
        if (!declaredDependencies.has(dependency)) {
            violations.push(
                `${manifest.name}/${relativeFile}: workspace import ${JSON.stringify(specifier)} is not declared in package.json`,
            );
        }
        if (!allowedDependencies?.has(dependency)) {
            violations.push(
                `${manifest.name}/${relativeFile}: workspace import ${JSON.stringify(specifier)} violates the declared package direction`,
            );
        }
    }

    return violations;
}

function verifyComponentHelperPlacement(packageName, sourceRoot) {
    const componentsRoot = resolve(sourceRoot, 'components');
    if (!existsSync(componentsRoot)) return [];

    const forbiddenDirectories = getDirectories(componentsRoot)
        .filter((directory) =>
            forbiddenLocalModuleNames.has(parsePath(directory).base.toLowerCase()),
        )
        .map((directory) => toPosixRelativePath(sourceRoot, directory));
    const forbiddenFiles = getFiles(componentsRoot)
        .filter(isProductionSourceFile)
        .filter((file) => forbiddenLocalModuleNames.has(parsePath(file).name.toLowerCase()))
        .map((file) => toPosixRelativePath(sourceRoot, file));

    return [...forbiddenDirectories, ...forbiddenFiles].map(
        (path) => `${packageName}/${path}: generic component-local helper modules are forbidden`,
    );
}

function verifyLayerDependencies(packageName, sourceRoot) {
    return layerRules.flatMap((rule) => {
        const layerRoot = resolve(sourceRoot, rule.directory);
        if (!existsSync(layerRoot)) return [];

        return getFiles(layerRoot)
            .filter(isProductionSourceFile)
            .flatMap((file) => {
                const source = readModuleSource(
                    file,
                    [],
                    packageName,
                    toPosixRelativePath(sourceRoot, file),
                );
                return getModuleSpecifiers(source, file).flatMap((specifier) => {
                    const dependency = getSourceDependency(file, specifier, sourceRoot);
                    if (!dependency || !rule.forbiddenDependencies.has(dependency)) return [];

                    return [
                        `${packageName}/${toPosixRelativePath(sourceRoot, file)}: ${rule.directory} cannot depend on ${dependency}`,
                    ];
                });
            });
    });
}

function getModuleSpecifiers(source, file) {
    const sourceFile = ts.createSourceFile(
        file,
        source,
        ts.ScriptTarget.Latest,
        true,
        file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
    );
    const specifiers = new Set();

    function visit(node) {
        if (
            (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
            node.moduleSpecifier &&
            ts.isStringLiteralLike(node.moduleSpecifier)
        ) {
            specifiers.add(node.moduleSpecifier.text);
        } else if (
            ts.isCallExpression(node) &&
            ((node.expression.kind === ts.SyntaxKind.ImportKeyword &&
                node.arguments.length === 1) ||
                (ts.isIdentifier(node.expression) &&
                    node.expression.text === 'require' &&
                    node.arguments.length === 1)) &&
            ts.isStringLiteralLike(node.arguments[0])
        ) {
            specifiers.add(node.arguments[0].text);
        }

        ts.forEachChild(node, visit);
    }

    visit(sourceFile);
    return [...specifiers];
}

function getSourceDependency(importer, specifier, sourceRoot) {
    let target;
    if (specifier.startsWith('@/')) {
        target = resolve(sourceRoot, specifier.slice(2));
    } else if (specifier.startsWith('.')) {
        target = resolve(dirname(importer), specifier);
    } else {
        return undefined;
    }

    const relativeTarget = toPosixRelativePath(sourceRoot, target);
    if (relativeTarget === '..' || relativeTarget.startsWith('../')) return undefined;
    return relativeTarget.split('/')[0];
}

function findWorkspaceDependency(specifier, packageNames) {
    return [...packageNames]
        .toSorted((left, right) => right.length - left.length)
        .find((name) => specifier === name || specifier.startsWith(`${name}/`));
}

function getFiles(directory) {
    if (!existsSync(directory)) return [];
    return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
        const path = resolve(directory, entry.name);
        return entry.isDirectory() ? getFiles(path) : [path];
    });
}

function getDirectories(directory) {
    if (!existsSync(directory)) return [];
    return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
        if (!entry.isDirectory()) return [];

        const path = resolve(directory, entry.name);
        return [path].concat(getDirectories(path));
    });
}

function isProductionSourceFile(file) {
    return productionSourceExtensions.has(extname(file)) && !testOrStoryPattern.test(file);
}

function hasJsxLanguage(block) {
    const language = block?.lang?.toLowerCase();
    return language === 'jsx' || language === 'tsx';
}

function toPosixRelativePath(root, file) {
    return relative(root, file).replaceAll('\\', '/');
}

function pathSeparator() {
    return process.platform === 'win32' ? '\\' : '/';
}

function run() {
    const workspaceRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
    const bundlesOnly = process.argv.includes('--bundles');
    const violations = bundlesOnly
        ? verifyWorkspaceBundles(workspaceRoot)
        : verifyWorkspaceContracts(workspaceRoot);
    if (violations.length > 0) {
        console.error(
            ['Workspace contract violations:', ...violations.map((item) => `- ${item}`)].join('\n'),
        );
        process.exitCode = 1;
        return;
    }

    console.log(
        bundlesOnly
            ? 'Workspace built bundles satisfy the zero-VDOM contract.'
            : 'Workspace package, dependency, and zero-VDOM contracts are satisfied.',
    );
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) run();
