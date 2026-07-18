import { describe, expect, it } from 'vitest';
import { vaporIconCompiler } from './unplugin-icons';

describe('vaporIconCompiler', () => {
    it('emits a Vapor component without VDOM helpers', async () => {
        const compiler = await vaporIconCompiler().compiler;
        const code = await compiler(
            '<svg viewBox="0 0 24 24"><path d="M4 12h16" /></svg>',
            'lucide',
            'test-icon',
        );

        expect(code).toContain('defineVaporComponent');
        expect(code).toContain('name: "lucide-test-icon"');
        expect(code).not.toMatch(/\b(?:createVNode|defineComponent|h)\s*\(/);
    });

    it('emits bindings for SVG paint server references', async () => {
        const compiler = await vaporIconCompiler().compiler;
        const code = await compiler(
            '<svg><defs><linearGradient id="gradient"><stop /></linearGradient></defs><path fill="url(#gradient)" /></svg>',
            'custom',
            'gradient-icon',
        );

        expect(code).toContain('_ctx.idMap');
        expect(code).toContain("'gradient':'uicons-'+__randId()");
        expect(code).toContain('setup()');
    });
});
