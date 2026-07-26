import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, extname, isAbsolute, parse as parsePath, relative, resolve } from 'node:path';
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
const forbiddenTableVueAdapter = '@tanstack/vue-table';
const jsxSourceExtensions = new Set(['.jsx', '.tsx']);
const productionSourceExtensions = new Set([
    '.cjs',
    '.cts',
    '.js',
    '.jsx',
    '.mjs',
    '.mts',
    '.ts',
    '.tsx',
    '.vue',
]);
const testOrStoryPattern = /\.(?:spec|story|stories|test)\.(?:cjs|cts|js|jsx|mjs|mts|ts|tsx|vue)$/;
const forbiddenVdomApis = new Set([
    'h',
    'VNode',
    'defineComponent',
    'createVNode',
    'cloneVNode',
    'isVNode',
    'openBlock',
    'createBlock',
    'createElementBlock',
]);
const vueRuntimeModules = ['vue', '@vue/runtime-core', '@vue/runtime-dom'];
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
    ['@ropav/table', new Set(['ropav'])],
]);

export function verifyWorkspaceContracts(workspaceRoot) {
    const packageRecords = readWorkspacePackages(workspaceRoot);
    const packageRecordsByName = new Map(
        packageRecords.map((packageRecord) => [packageRecord.manifest.name, packageRecord]),
    );
    const violations = packageRecords.flatMap((packageRecord) =>
        verifyPackageManifest(packageRecord, packageRecordsByName).concat(
            verifyPackageSource(packageRecord, packageRecordsByName),
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
                for (const api of getForbiddenVdomImports(source, file)) {
                    fileViolations.push(
                        `${manifest.name}/${relativeFile}: built output matches forbidden VDOM pattern imported Vue API ${api}`,
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
                    compilerOptions: readPackageCompilerOptions(packageRoot),
                    manifest: JSON.parse(readFileSync(manifestPath, 'utf8')),
                    packageRoot,
                    sourceRoot: resolve(packageRoot, 'src'),
                },
            ];
        });
}

function verifyPackageManifest(packageRecord, packageRecordsByName) {
    const { manifest } = packageRecord;
    const packageNames = new Set(packageRecordsByName.keys());
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
            const aliasesForbiddenTableVueAdapter =
                typeof range === 'string' &&
                (range === `npm:${forbiddenTableVueAdapter}` ||
                    range.startsWith(`npm:${forbiddenTableVueAdapter}@`));
            if (
                manifest.name === '@ropav/table' &&
                (dependency === forbiddenTableVueAdapter || aliasesForbiddenTableVueAdapter)
            ) {
                const alias = aliasesForbiddenTableVueAdapter
                    ? ` through npm alias ${JSON.stringify(dependency)}`
                    : '';
                violations.push(
                    `${manifest.name}: ${field} must use @tanstack/table-core instead of ${forbiddenTableVueAdapter}${alias}`,
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

function verifyPackageSource(packageRecord, packageRecordsByName) {
    const { manifest, packageRoot, sourceRoot } = packageRecord;
    if (manifest.private === true || !existsSync(sourceRoot)) return [];

    const productionFiles = getFiles(sourceRoot).filter(isProductionSourceFile);
    const violations = [
        ...verifyComponentPlacement(manifest.name, sourceRoot),
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
        for (const api of getForbiddenVdomImports(moduleSource, file)) {
            violations.push(
                `${manifest.name}/${relativeFile}: production source matches forbidden VDOM pattern imported Vue API ${api}`,
            );
        }
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
                packageRecord,
                packageRecordsByName,
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
    packageRecord,
    packageRecordsByName,
    packageRoot,
    relativeFile,
    specifiers,
}) {
    const violations = [];
    const packageNames = new Set(packageRecordsByName.keys());
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
        if (
            manifest.name === '@ropav/table' &&
            (specifier === forbiddenTableVueAdapter ||
                specifier.startsWith(`${forbiddenTableVueAdapter}/`))
        ) {
            violations.push(
                `${manifest.name}/${relativeFile}: import ${JSON.stringify(specifier)} violates the zero-VDOM TanStack Table contract`,
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
        if (!dependency) {
            const aliasedPackage = resolveAliasedWorkspacePackage({
                file,
                packageRecord,
                packageRecordsByName,
                specifier,
            });
            if (aliasedPackage) {
                violations.push(
                    `${manifest.name}/${relativeFile}: import ${JSON.stringify(specifier)} resolves across the ${aliasedPackage.manifest.name} package seam; import through its public workspace package interface`,
                );
            }
            continue;
        }
        if (dependency === manifest.name) {
            if (specifier === manifest.name) {
                violations.push(
                    `${manifest.name}/${relativeFile}: internal source must not import its own package root barrel`,
                );
            }
            continue;
        }
        if (specifier === `${dependency}/src` || specifier.startsWith(`${dependency}/src/`)) {
            violations.push(
                `${manifest.name}/${relativeFile}: import ${JSON.stringify(specifier)} reaches into another package's source`,
            );
        }
        const dependencyRecord = packageRecordsByName.get(dependency);
        if (
            dependencyRecord &&
            !isWorkspaceSpecifierExported(dependencyRecord.manifest, specifier)
        ) {
            violations.push(
                `${manifest.name}/${relativeFile}: workspace import ${JSON.stringify(specifier)} is not exposed by ${dependency} package.json exports`,
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

function resolveAliasedWorkspacePackage({ file, packageRecord, packageRecordsByName, specifier }) {
    if (specifier.startsWith('.')) return undefined;

    for (const compilerOptions of packageRecord.compilerOptions) {
        const result = ts.resolveModuleName(specifier, file, compilerOptions, ts.sys);
        const resolvedFile = result.resolvedModule?.resolvedFileName;
        const candidates =
            resolvedFile === undefined
                ? resolvePathMappingTargets(specifier, compilerOptions, packageRecord.packageRoot)
                : [resolvedFile];

        for (const candidatePath of candidates) {
            const owner = [...packageRecordsByName.values()].find((candidate) =>
                isPathInside(candidate.packageRoot, candidatePath),
            );
            if (owner && owner.manifest.name !== packageRecord.manifest.name) return owner;
        }
    }

    return undefined;
}

function resolvePathMappingTargets(specifier, compilerOptions, packageRoot) {
    const paths = compilerOptions.paths;
    if (!paths || typeof paths !== 'object') return [];

    const exactMatch = Object.hasOwn(paths, specifier) ? specifier : undefined;
    const patternMatch =
        exactMatch ??
        Object.keys(paths)
            .filter((pattern) => pattern.includes('*') && matchesExportPattern(specifier, pattern))
            .toSorted(compareExportPatterns)[0];
    if (patternMatch === undefined) return [];

    const wildcard = patternMatch.includes('*')
        ? getPatternWildcard(specifier, patternMatch)
        : undefined;
    const basePath = compilerOptions.pathsBasePath ?? compilerOptions.baseUrl ?? packageRoot;
    return (paths[patternMatch] ?? [])
        .map((target) =>
            resolve(basePath, wildcard === undefined ? target : target.replaceAll('*', wildcard)),
        )
        .flatMap(resolveExistingModulePath)
        .slice(0, 1);
}

function getPatternWildcard(value, pattern) {
    const wildcardIndex = pattern.indexOf('*');
    const prefix = pattern.slice(0, wildcardIndex);
    const suffix = pattern.slice(wildcardIndex + 1);
    return value.slice(prefix.length, suffix.length === 0 ? undefined : -suffix.length);
}

function resolveExistingModulePath(candidate) {
    const candidates = [
        candidate,
        ...[...productionSourceExtensions].map((extension) => `${candidate}${extension}`),
        ...[...productionSourceExtensions].map((extension) =>
            resolve(candidate, `index${extension}`),
        ),
    ];
    const existing = candidates.find((path) => {
        if (!existsSync(path)) return false;
        try {
            return statSync(path).isFile();
        } catch {
            return false;
        }
    });
    return existing === undefined ? [] : [existing];
}

function isWorkspaceSpecifierExported(manifest, specifier) {
    const packageExports = manifest.exports;
    if (packageExports === undefined) return true;

    const subpath = specifier === manifest.name ? '.' : `.${specifier.slice(manifest.name.length)}`;
    return hasExportTarget(resolvePackageExportTarget(packageExports, subpath));
}

function resolvePackageExportTarget(packageExports, subpath) {
    if (
        typeof packageExports === 'string' ||
        packageExports === null ||
        Array.isArray(packageExports)
    ) {
        return subpath === '.' ? packageExports : undefined;
    }
    if (typeof packageExports !== 'object') return undefined;

    const exportKeys = Object.keys(packageExports);
    const hasSubpathKeys = exportKeys.some((key) => key.startsWith('.'));
    if (!hasSubpathKeys) return subpath === '.' ? packageExports : undefined;
    if (Object.hasOwn(packageExports, subpath)) return packageExports[subpath];

    const matchingPattern = exportKeys
        .filter((key) => key.includes('*') && matchesPackageExportPattern(subpath, key))
        .toSorted(compareExportPatterns)[0];
    return matchingPattern === undefined ? undefined : packageExports[matchingPattern];
}

function compareExportPatterns(left, right) {
    const leftWildcard = left.indexOf('*');
    const rightWildcard = right.indexOf('*');
    const prefixDifference = rightWildcard - leftWildcard;
    return prefixDifference === 0 ? right.length - left.length : prefixDifference;
}

function matchesExportPattern(subpath, pattern) {
    const wildcardIndex = pattern.indexOf('*');
    const prefix = pattern.slice(0, wildcardIndex);
    const suffix = pattern.slice(wildcardIndex + 1);
    return (
        subpath.startsWith(prefix) &&
        subpath.endsWith(suffix) &&
        subpath.length >= prefix.length + suffix.length
    );
}

function matchesPackageExportPattern(subpath, pattern) {
    return subpath.length >= pattern.length && matchesExportPattern(subpath, pattern);
}

function hasExportTarget(target) {
    if (typeof target === 'string') return true;
    if (Array.isArray(target)) return target.some(hasExportTarget);
    if (!target || typeof target !== 'object') return false;
    return Object.values(target).some(hasExportTarget);
}

function isPathInside(root, target) {
    const relativeTarget = relative(root, target);
    return (
        relativeTarget !== '..' &&
        !relativeTarget.startsWith(`..${pathSeparator()}`) &&
        !isAbsolute(relativeTarget)
    );
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

function verifyComponentPlacement(packageName, sourceRoot) {
    const componentsRoot = resolve(sourceRoot, 'components');
    const sfcViolations = getFiles(sourceRoot)
        .filter(isProductionSourceFile)
        .filter((file) => extname(file) === '.vue')
        .filter((file) => {
            if (!isPathInside(componentsRoot, file)) return true;
            return dirname(relative(componentsRoot, file)) === '.';
        })
        .map(
            (file) =>
                `${packageName}/${toPosixRelativePath(sourceRoot, file)}: production Vue SFC must live under src/components/<name>/`,
        );
    if (!existsSync(componentsRoot)) return sfcViolations;

    const componentNames = readdirSync(componentsRoot, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name);
    const misplacedModuleViolations = componentNames.flatMap((componentName) =>
        getFiles(resolve(sourceRoot, componentName))
            .filter(isProductionSourceFile)
            .map(
                (file) =>
                    `${packageName}/${toPosixRelativePath(sourceRoot, file)}: component-local modules for ${componentName} must live under src/components/${componentName}/`,
            ),
    );

    return sfcViolations.concat(misplacedModuleViolations);
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

function readPackageCompilerOptions(packageRoot) {
    return readdirSync(packageRoot, { withFileTypes: true })
        .filter((entry) => entry.isFile() && /^tsconfig(?:\..+)?\.json$/.test(entry.name))
        .flatMap((entry) => {
            const configPath = resolve(packageRoot, entry.name);
            const config = ts.readConfigFile(configPath, ts.sys.readFile);
            if (config.error) return [];

            const parsedConfig = ts.parseJsonConfigFileContent(
                config.config,
                ts.sys,
                packageRoot,
                undefined,
                configPath,
            );
            return [parsedConfig.options];
        });
}

function getForbiddenVdomImports(source, file) {
    const sourceFile = createTypeScriptSourceFile(source, file);
    const forbiddenImports = new Set();
    const namespaceImports = new Set();

    function collectImports(node) {
        if (
            ts.isImportDeclaration(node) &&
            node.moduleSpecifier &&
            ts.isStringLiteralLike(node.moduleSpecifier) &&
            isVueRuntimeModule(node.moduleSpecifier.text)
        ) {
            const bindings = node.importClause?.namedBindings;
            if (bindings && ts.isNamedImports(bindings)) {
                for (const element of bindings.elements) {
                    const importedName = (element.propertyName ?? element.name).text;
                    if (forbiddenVdomApis.has(importedName)) forbiddenImports.add(importedName);
                }
            } else if (bindings && ts.isNamespaceImport(bindings)) {
                namespaceImports.add(bindings.name.text);
            }
        } else if (
            ts.isExportDeclaration(node) &&
            node.moduleSpecifier &&
            ts.isStringLiteralLike(node.moduleSpecifier) &&
            isVueRuntimeModule(node.moduleSpecifier.text)
        ) {
            if (!node.exportClause || ts.isNamespaceExport(node.exportClause)) {
                forbiddenImports.add('*');
            } else if (ts.isNamedExports(node.exportClause)) {
                for (const element of node.exportClause.elements) {
                    const importedName = (element.propertyName ?? element.name).text;
                    if (forbiddenVdomApis.has(importedName)) forbiddenImports.add(importedName);
                }
            }
        } else if (
            ts.isVariableDeclaration(node) &&
            node.initializer &&
            isVueModuleExpression(node.initializer)
        ) {
            if (ts.isIdentifier(node.name)) {
                namespaceImports.add(node.name.text);
            } else if (ts.isObjectBindingPattern(node.name)) {
                collectForbiddenObjectBindings(node.name, forbiddenImports);
            }
        }

        ts.forEachChild(node, collectImports);
    }

    function collectNamespaceAccesses(node) {
        if (
            ts.isVariableDeclaration(node) &&
            ts.isObjectBindingPattern(node.name) &&
            node.initializer &&
            ts.isIdentifier(node.initializer) &&
            namespaceImports.has(node.initializer.text)
        ) {
            collectForbiddenObjectBindings(node.name, forbiddenImports);
        }
        if (
            ts.isPropertyAccessExpression(node) &&
            ((ts.isIdentifier(node.expression) && namespaceImports.has(node.expression.text)) ||
                isVueModuleExpression(node.expression)) &&
            forbiddenVdomApis.has(node.name.text)
        ) {
            forbiddenImports.add(node.name.text);
        } else if (
            ts.isElementAccessExpression(node) &&
            ((ts.isIdentifier(node.expression) && namespaceImports.has(node.expression.text)) ||
                isVueModuleExpression(node.expression)) &&
            node.argumentExpression &&
            ts.isStringLiteralLike(node.argumentExpression) &&
            forbiddenVdomApis.has(node.argumentExpression.text)
        ) {
            forbiddenImports.add(node.argumentExpression.text);
        }

        ts.forEachChild(node, collectNamespaceAccesses);
    }

    collectImports(sourceFile);
    collectNamespaceAccesses(sourceFile);
    return [...forbiddenImports].toSorted();
}

function collectForbiddenObjectBindings(binding, forbiddenImports) {
    for (const element of binding.elements) {
        const importedName = element.propertyName
            ? getStaticPropertyName(element.propertyName)
            : getStaticPropertyName(element.name);
        if (forbiddenVdomApis.has(importedName)) forbiddenImports.add(importedName);
    }
}

function getStaticPropertyName(name) {
    if (ts.isIdentifier(name) || ts.isStringLiteralLike(name)) return name.text;
    if (ts.isComputedPropertyName(name) && ts.isStringLiteralLike(name.expression)) {
        return name.expression.text;
    }
    return undefined;
}

function isVueRuntimeModule(specifier) {
    return vueRuntimeModules.some(
        (moduleName) => specifier === moduleName || specifier.startsWith(`${moduleName}/`),
    );
}

function isVueModuleExpression(node) {
    const expression = unwrapModuleExpression(node);
    return (
        ts.isCallExpression(expression) &&
        ((ts.isIdentifier(expression.expression) && expression.expression.text === 'require') ||
            expression.expression.kind === ts.SyntaxKind.ImportKeyword) &&
        expression.arguments.length === 1 &&
        ts.isStringLiteralLike(expression.arguments[0]) &&
        isVueRuntimeModule(expression.arguments[0].text)
    );
}

function unwrapModuleExpression(node) {
    let expression = node;
    while (ts.isAwaitExpression(expression) || ts.isParenthesizedExpression(expression)) {
        expression = expression.expression;
    }
    return expression;
}

function getModuleSpecifiers(source, file) {
    const sourceFile = createTypeScriptSourceFile(source, file);
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

function createTypeScriptSourceFile(source, file) {
    return ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, getScriptKind(file));
}

function getScriptKind(file) {
    switch (extname(file)) {
        case '.js':
        case '.cjs':
        case '.mjs':
            return ts.ScriptKind.JS;
        case '.jsx':
            return ts.ScriptKind.JSX;
        case '.tsx':
            return ts.ScriptKind.TSX;
        default:
            return ts.ScriptKind.TS;
    }
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
    let options;
    try {
        options = parseCliOptions(process.argv.slice(2));
    } catch (error) {
        console.error(`Workspace contract verifier failed: ${error.message}`);
        process.exitCode = 1;
        return;
    }

    let violations;
    try {
        violations = options.bundlesOnly
            ? verifyWorkspaceBundles(workspaceRoot)
            : verifyWorkspaceContracts(workspaceRoot);
    } catch (error) {
        console.error(`Workspace contract verifier failed: ${error.message}`);
        process.exitCode = 1;
        return;
    }
    if (violations.length > 0) {
        console.error(
            ['Workspace contract violations:', ...violations.map((item) => `- ${item}`)].join('\n'),
        );
        process.exitCode = 1;
        return;
    }

    console.log(
        options.bundlesOnly
            ? 'Workspace built bundles satisfy the zero-VDOM contract.'
            : 'Workspace package, dependency, and zero-VDOM contracts are satisfied.',
    );
}

function parseCliOptions(arguments_) {
    if (arguments_.length === 0) return { bundlesOnly: false };
    if (arguments_.length === 1 && arguments_[0] === '--bundles') {
        return { bundlesOnly: true };
    }
    throw new Error('Expected no arguments or a single --bundles flag');
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) run();
