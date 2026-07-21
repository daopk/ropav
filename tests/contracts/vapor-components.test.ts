import { readdirSync, readFileSync } from 'node:fs';
import { dirname, extname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '../../src/components');

function getFiles(directory: string): string[] {
    return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
        const path = resolve(directory, entry.name);
        return entry.isDirectory() ? getFiles(path) : [path];
    });
}

const componentFiles = getFiles(rootDir);
const vaporScriptPattern = /<script\b(?=[^>]*\bsetup\b)(?=[^>]*\bvapor\b)[^>]*>/;
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

describe('Vapor-only component contract', () => {
    it('compiles every Vue component in Vapor mode', () => {
        const nonVaporFiles = componentFiles
            .filter((file) => extname(file) === '.vue')
            .filter((file) => !vaporScriptPattern.test(readFileSync(file, 'utf8')))
            .map((file) => relative(rootDir, file));

        expect(nonVaporFiles).toEqual([]);
    });

    it('does not use VDOM APIs in production component sources', () => {
        const violations = componentFiles
            .filter((file) => extname(file) === '.ts')
            .filter((file) => !/\.(?:test|stories|story)\.ts$/.test(file))
            .flatMap((file) => {
                const source = readFileSync(file, 'utf8');
                return vdomPatterns
                    .filter((pattern) => pattern.test(source))
                    .map((pattern) => `${relative(rootDir, file)}: ${pattern.source}`);
            });

        expect(violations).toEqual([]);
    });
});
