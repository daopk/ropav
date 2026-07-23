import { readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, extname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { SFCDescriptor } from 'vue/compiler-sfc';

export const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
export const sourceRoot = resolve(repositoryRoot, 'src');

const jsxSourceExtensions = new Set(['.jsx', '.tsx']);
const productionSourceExtensions = new Set(['.js', '.jsx', '.ts', '.tsx', '.vue']);
const testOrStoryPattern = /\.(?:spec|story|stories|test)\.(?:js|jsx|ts|tsx|vue)$/;
const require = createRequire(import.meta.url);
const { parse } = require('vue/compiler-sfc') as {
    parse(source: string): { descriptor: SFCDescriptor };
};

export function getFiles(directory: string): string[] {
    return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
        const path = resolve(directory, entry.name);
        return entry.isDirectory() ? getFiles(path) : [path];
    });
}

export function getDirectories(directory: string): string[] {
    return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
        if (!entry.isDirectory()) return [];

        const path = resolve(directory, entry.name);
        return [path].concat(getDirectories(path));
    });
}

export function isProductionSourceFile(file: string) {
    return productionSourceExtensions.has(extname(file)) && !testOrStoryPattern.test(file);
}

export function isJsxSourceFile(file: string) {
    return jsxSourceExtensions.has(extname(file));
}

export function hasVaporScriptSetup(source: string) {
    const { scriptSetup } = parse(source).descriptor;
    return Boolean(scriptSetup && Object.hasOwn(scriptSetup.attrs, 'vapor'));
}

export function hasJsxVueScript(source: string) {
    return getVueScriptBlocks(source).some((block) => {
        const language = block.lang?.toLowerCase();
        return language === 'jsx' || language === 'tsx';
    });
}

export function readVueModuleScriptSource(source: string) {
    return getVueScriptBlocks(source)
        .map((block) => block.content)
        .join('\n');
}

export function readModuleScriptSource(file: string) {
    const source = readFileSync(file, 'utf8');
    if (extname(file) !== '.vue') return source;

    return readVueModuleScriptSource(source);
}

export function toPosixRelativePath(root: string, file: string) {
    return relative(root, file).replaceAll('\\', '/');
}

function getVueScriptBlocks(source: string) {
    const { script, scriptSetup } = parse(source).descriptor;
    return [script, scriptSetup].filter((block) => block !== null);
}
