import { readFileSync } from 'node:fs';
import { extname } from 'node:path';
import { describe, expect, it } from 'vitest';

import {
    getFiles,
    hasJsxVueScript,
    hasVaporScriptSetup,
    isJsxSourceFile,
    isProductionSourceFile,
    readModuleScriptSource,
    readVueModuleScriptSource,
    sourceRoot,
    toPosixRelativePath,
} from './source-contract-utils';

const productionSourceFiles = getFiles(sourceRoot).filter(isProductionSourceFile);
const productionVueFiles = productionSourceFiles.filter((file) => extname(file) === '.vue');
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
    it('compiles every production Vue SFC in Vapor mode', () => {
        const nonVaporFiles = productionVueFiles
            .filter((file) => !hasVaporScriptSetup(readFileSync(file, 'utf8')))
            .map((file) => toPosixRelativePath(sourceRoot, file));

        expect(nonVaporFiles).toEqual([]);
    });

    it('does not use JSX-capable production sources or Vue script blocks', () => {
        const jsxSourceFiles = productionSourceFiles
            .filter(isJsxSourceFile)
            .map((file) => toPosixRelativePath(sourceRoot, file));
        const jsxVueScripts = productionVueFiles
            .filter((file) => hasJsxVueScript(readFileSync(file, 'utf8')))
            .map((file) => toPosixRelativePath(sourceRoot, file));

        expect([...jsxSourceFiles, ...jsxVueScripts]).toEqual([]);
    });

    it('does not use VDOM APIs in production source scripts', () => {
        const violations = productionSourceFiles.flatMap((file) => {
            const source = readModuleScriptSource(file);
            return vdomPatterns
                .filter((pattern) => pattern.test(source))
                .map((pattern) => `${toPosixRelativePath(sourceRoot, file)}: ${pattern.source}`);
        });

        expect(violations).toEqual([]);
    });

    it('classifies JSX sources and only inspects top-level Vue script blocks', () => {
        const source = `
            <template>
                <script lang="tsx">template content</script>
            </template>
            <script setup lang="ts" vapor>
                const label = 'Vapor component';
            </script>
        `;

        expect(isProductionSourceFile('/repo/src/render.jsx')).toBe(true);
        expect(isProductionSourceFile('/repo/src/render.tsx')).toBe(true);
        expect(isProductionSourceFile('/repo/src/render.test.jsx')).toBe(false);
        expect(isProductionSourceFile('/repo/src/render.stories.tsx')).toBe(false);
        expect(hasVaporScriptSetup(source)).toBe(true);
        expect(hasJsxVueScript(source)).toBe(false);
        expect(readVueModuleScriptSource(source)).toContain("const label = 'Vapor component';");
        expect(readVueModuleScriptSource(source)).not.toContain('template content');
        expect(hasJsxVueScript('<script setup lang="jsx" vapor>const view = true;</script>')).toBe(
            true,
        );
        expect(hasJsxVueScript('<script setup lang="tsx" vapor>const view = true;</script>')).toBe(
            true,
        );
    });
});
