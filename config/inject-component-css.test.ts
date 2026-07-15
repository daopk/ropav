import { describe, expect, it } from 'vitest';
import { flattenRopavLayers } from './inject-component-css';

describe('legacy unlayered stylesheet generation', () => {
    it('removes only Ropav layer wrappers and keeps nested rules intact', () => {
        const source = `
            @layer ropav.tokens, ropav.components;
            @layer ropav.tokens { :root { --public-token: red; } }
            @layer ropav.components {
                .component { color: var(--public-token); }
                @media (min-width: 10px) { .component { display: block; } }
            }
        `;
        const result = flattenRopavLayers(source);

        expect(result).not.toContain('@layer ropav.tokens');
        expect(result).not.toContain('@layer ropav.components');
        expect(result).toContain(':root { --public-token: red; }');
        expect(result).toContain('@media (min-width: 10px)');
    });

    it('ignores braces and layer syntax inside strings, comments, and data URLs', () => {
        const source = String.raw`/* @layer ropav.tokens, ropav.components; @layer ropav.components { .decoy {} } */
@layer ropav.components {
    .label::after { content: "}"; }
    .single-quoted::after { content: '}'; }
    .escaped::after { content: "\"}"; }
    /* } does not close the layer and { does not open one */
    .icon { background-image: url(data:text/css,@layer ropav.components {PAYLOAD}); }
}
.after-layer { display: block; }`;

        const result = flattenRopavLayers(source);

        expect(result).toContain(
            '/* @layer ropav.tokens, ropav.components; @layer ropav.components { .decoy {} } */',
        );
        expect(result).toContain('.label::after { content: "}"; }');
        expect(result).toContain(".single-quoted::after { content: '}'; }");
        expect(result).toContain(String.raw`.escaped::after { content: "\"}"; }`);
        expect(result).toContain('/* } does not close the layer and { does not open one */');
        expect(result).toContain('url(data:text/css,@layer ropav.components {PAYLOAD})');
        expect(result).toContain('.after-layer { display: block; }');
    });
});
