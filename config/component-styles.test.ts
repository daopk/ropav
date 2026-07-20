import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const buttonStyles = readFileSync(resolve(rootDir, 'src/components/button/button.scss'), 'utf8');

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
});
