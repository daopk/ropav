import { describe, expect, it, vi } from 'vitest';

import { resolveEditorProps, splitEditorFallthroughAttributes } from './editorAttributesModel';

describe('editorAttributesModel', () => {
    it('routes accessibility and tab-order attributes to the editor control', () => {
        expect(
            splitEditorFallthroughAttributes({
                class: 'custom-root',
                'data-testid': 'editor',
                'aria-label': 'Article body',
                'aria-invalid': false,
                tabindex: -1,
            }),
        ).toEqual({
            controlAttributes: {
                'aria-label': 'Article body',
                'aria-invalid': 'false',
                tabindex: '-1',
            },
            rootAttributes: {
                class: 'custom-root',
                'data-testid': 'editor',
            },
        });
    });

    it('normalizes reactive editor props without exposing Tiptap-owned view hooks', () => {
        const dispatchTransaction = vi.fn();
        const transformPastedHTML = vi.fn((html: string) => html);
        const attributes = vi.fn(() => ({
            'aria-label': 'Configured label',
            class: 'configured-editor',
            role: 'document',
        }));
        const editorProps = {
            attributes,
            dispatchTransaction,
            transformPastedHTML,
        } as unknown as Parameters<typeof resolveEditorProps>[0];
        const resolved = resolveEditorProps(editorProps, {
            'aria-label': 'Fallthrough label',
        });
        const reactiveAttributes = resolved.reactive.attributes;

        expect(resolved.initial.attributes).toEqual({
            'aria-label': 'Fallthrough label',
            role: 'textbox',
        });
        expect(resolved.reactive).not.toHaveProperty('dispatchTransaction');
        expect(resolved.reactive).not.toHaveProperty('transformPastedHTML');
        expect(resolved.transformPastedHTML).toBe(transformPastedHTML);
        expect(typeof reactiveAttributes).toBe('function');
        expect(
            typeof reactiveAttributes === 'function' ? reactiveAttributes({} as never) : undefined,
        ).toEqual({
            'aria-label': 'Fallthrough label',
            class: 'tiptap configured-editor',
            role: 'textbox',
        });
    });
});
