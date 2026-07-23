import { dirname, parse, resolve } from 'node:path';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';

import {
    getDirectories,
    getFiles,
    isProductionSourceFile,
    readModuleScriptSource,
    sourceRoot,
    toPosixRelativePath,
} from './source-contract-utils';

const componentsRoot = resolve(sourceRoot, 'components');
const forbiddenLocalModuleNames = new Set(['core', 'helpers', 'utils']);

interface LayerRule {
    directory: string;
    forbiddenDependencies: ReadonlySet<string>;
}

const layerRules: LayerRule[] = [
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

describe('source architecture contract', () => {
    it('keeps generic helper modules out of component directories', () => {
        const forbiddenDirectories = getDirectories(componentsRoot)
            .filter((directory) =>
                forbiddenLocalModuleNames.has(parse(directory).base.toLowerCase()),
            )
            .map((directory) => toPosixRelativePath(sourceRoot, directory));
        const forbiddenFiles = getFiles(componentsRoot)
            .filter(isProductionSourceFile)
            .filter((file) => forbiddenLocalModuleNames.has(parse(file).name.toLowerCase()))
            .map((file) => toPosixRelativePath(sourceRoot, file));

        expect([...forbiddenDirectories, ...forbiddenFiles]).toEqual([]);
    });

    it('keeps dependencies pointing from higher-level modules to lower-level modules', () => {
        const violations = layerRules.flatMap((rule) => {
            const layerRoot = resolve(sourceRoot, rule.directory);

            return getFiles(layerRoot)
                .filter(isProductionSourceFile)
                .flatMap((file) =>
                    getModuleSpecifiers(readModuleScriptSource(file), file).flatMap((specifier) => {
                        const dependency = getSourceDependency(file, specifier);
                        if (!dependency || !rule.forbiddenDependencies.has(dependency)) {
                            return [];
                        }

                        return [
                            `${toPosixRelativePath(sourceRoot, file)} imports ${JSON.stringify(
                                specifier,
                            )}: ${rule.directory} cannot depend on ${dependency}`,
                        ];
                    }),
                );
        });

        expect(violations).toEqual([]);
    });
});

function getModuleSpecifiers(source: string, file: string) {
    const sourceFile = ts.createSourceFile(
        file,
        source,
        ts.ScriptTarget.Latest,
        true,
        file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
    );
    const specifiers = new Set<string>();

    function visit(node: ts.Node) {
        if (
            (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
            node.moduleSpecifier &&
            ts.isStringLiteralLike(node.moduleSpecifier)
        ) {
            specifiers.add(node.moduleSpecifier.text);
        } else if (
            ts.isCallExpression(node) &&
            node.expression.kind === ts.SyntaxKind.ImportKeyword &&
            node.arguments.length === 1 &&
            ts.isStringLiteralLike(node.arguments[0])
        ) {
            specifiers.add(node.arguments[0].text);
        }

        ts.forEachChild(node, visit);
    }

    visit(sourceFile);
    return [...specifiers];
}

function getSourceDependency(importer: string, specifier: string) {
    let target: string;
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
