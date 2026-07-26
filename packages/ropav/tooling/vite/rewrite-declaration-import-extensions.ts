import { existsSync } from 'node:fs';
import { dirname, extname, relative, resolve } from 'node:path';
import ts from 'typescript';

interface RewriteDeclarationImportExtensionsOptions {
    declarationRoot: string;
    sourceRoot: string;
    fileExists?: (filePath: string) => boolean;
}

interface Replacement {
    start: number;
    end: number;
    value: string;
}

const indexSourceFileNames = ['index.ts', 'index.tsx', 'index.mts', 'index.cts', 'index.vue'];

export function rewriteDeclarationImportExtensions(
    filePath: string,
    content: string,
    options: RewriteDeclarationImportExtensionsOptions,
) {
    const fileExists = options.fileExists ?? existsSync;
    const sourceDirectory = resolve(
        options.sourceRoot,
        dirname(relative(options.declarationRoot, resolve(filePath))),
    );
    const sourceFile = ts.createSourceFile(
        filePath,
        content,
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TS,
    );
    const replacements: Replacement[] = [];

    function addReplacement(moduleSpecifier: ts.StringLiteralLike) {
        const literalStart = moduleSpecifier.getStart(sourceFile);
        const literalEnd = moduleSpecifier.getEnd();
        const literal = content.slice(literalStart, literalEnd);
        const quote = literal[0];

        if ((quote !== "'" && quote !== '"') || literal.at(-1) !== quote) return;

        const specifier = literal.slice(1, -1);
        const suffixIndex = specifier.search(/[?#]/);
        const path = suffixIndex === -1 ? specifier : specifier.slice(0, suffixIndex);
        const suffix = suffixIndex === -1 ? '' : specifier.slice(suffixIndex);

        if (!/^\.{1,2}\//.test(path) || extname(path)) return;

        const sourceTarget = resolve(sourceDirectory, path);
        const resolvesToIndex = indexSourceFileNames.some((file) =>
            fileExists(resolve(sourceTarget, file)),
        );
        const resolvedPath = resolvesToIndex ? `${path}/index.js` : `${path}.js`;

        replacements.push({
            start: literalStart,
            end: literalEnd,
            value: `${quote}${resolvedPath}${suffix}${quote}`,
        });
    }

    function visit(node: ts.Node) {
        if (
            (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
            node.moduleSpecifier &&
            ts.isStringLiteralLike(node.moduleSpecifier)
        ) {
            addReplacement(node.moduleSpecifier);
        } else if (
            ts.isImportEqualsDeclaration(node) &&
            ts.isExternalModuleReference(node.moduleReference) &&
            node.moduleReference.expression &&
            ts.isStringLiteralLike(node.moduleReference.expression)
        ) {
            addReplacement(node.moduleReference.expression);
        } else if (
            ts.isImportTypeNode(node) &&
            ts.isLiteralTypeNode(node.argument) &&
            ts.isStringLiteralLike(node.argument.literal)
        ) {
            addReplacement(node.argument.literal);
        } else if (ts.isModuleDeclaration(node) && ts.isStringLiteralLike(node.name)) {
            addReplacement(node.name);
        } else if (
            ts.isCallExpression(node) &&
            node.expression.kind === ts.SyntaxKind.ImportKeyword &&
            node.arguments[0] &&
            ts.isStringLiteralLike(node.arguments[0])
        ) {
            addReplacement(node.arguments[0]);
        }

        ts.forEachChild(node, visit);
    }

    visit(sourceFile);

    // TypeScript visits child nodes in source order, so apply replacements from the end.
    return replacements.reduceRight(
        (rewritten, replacement) =>
            `${rewritten.slice(0, replacement.start)}${replacement.value}${rewritten.slice(replacement.end)}`,
        content,
    );
}
