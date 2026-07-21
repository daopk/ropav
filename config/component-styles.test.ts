import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const buttonStyles = readFileSync(resolve(rootDir, 'src/components/button/button.scss'), 'utf8');
const buttonStoryStyles = readFileSync(
    resolve(rootDir, 'src/components/button/button.stories.scss'),
    'utf8',
);
const progressStyles = readFileSync(
    resolve(rootDir, 'src/components/progress/progress.scss'),
    'utf8',
);
const styleMixins = readFileSync(resolve(rootDir, 'src/styles/_mixins.scss'), 'utf8');

describe('component style accessibility contracts', () => {
    it('changes button foreground and background colors atomically', () => {
        const transition = buttonStyles.match(
            /\.rp-button\s*\{[\s\S]*?transition:\s*([\s\S]*?);/,
        )?.[1];

        expect(transition).toBeDefined();
        expect(transition).not.toMatch(/^\s*(?:background-color|color)\b/m);
        expect(transition).toMatch(/^\s*border-color\b/m);
        expect(transition).toMatch(/^\s*box-shadow\b/m);
        expect(transition).toMatch(/^\s*transform\b/m);
    });

    it('stops perpetual loading motion when reduced motion is preferred', () => {
        expect(styleMixins).toMatch(
            /@mixin spinner-icon[\s\S]*?@media \(prefers-reduced-motion: reduce\) \{\s*animation: none;/,
        );
        expect(progressStyles).toMatch(
            /@media \(prefers-reduced-motion: reduce\) \{[\s\S]*?\.rp-progress__indicator\s*\{\s*transition: none;[\s\S]*?\.rp-progress--indeterminate \.rp-progress__indicator\s*\{\s*animation: none;/,
        );
        expect(buttonStoryStyles).toMatch(
            /@media \(prefers-reduced-motion: reduce\) \{\s*\.rp-button-story-dots span\s*\{\s*animation: none;/,
        );
    });
});
