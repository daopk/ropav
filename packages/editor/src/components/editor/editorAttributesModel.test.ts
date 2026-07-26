import { describe, expect, it, vi } from 'vitest';

import { resolveEditorProps, splitEditorFallthroughAttributes } from './editorAttributesModel';

describe('editorAttributesModel', () => {
    it('routes accessibility and tab-order attributes to the editor control', () => {
        expect(
            splitEditorFallthroughAttributes(
                {
                    class: 'custom-root',
                    'data-testid': 'editor',
                    'aria-label': 'Article body',
                    'aria-invalid': false,
                    'aria-multiline': false,
                    'aria-readonly': true,
                    tabindex: -1,
                },
                true,
            ),
        ).toEqual({
            controlAttributes: {
                'aria-label': 'Article body',
                'aria-invalid': 'false',
                'aria-multiline': 'true',
                'aria-readonly': 'false',
                tabindex: '-1',
            },
            rootAttributes: {
                class: 'custom-root',
                'data-testid': 'editor',
            },
        });
    });

    it('marks the owned textbox as multiline and readonly when editing is disabled', () => {
        expect(
            splitEditorFallthroughAttributes(
                {
                    'aria-describedby': 'article-hint',
                    'aria-multiline': false,
                    'aria-readonly': false,
                },
                false,
            ),
        ).toEqual({
            controlAttributes: {
                'aria-describedby': 'article-hint',
                'aria-multiline': 'true',
                'aria-readonly': 'true',
            },
            rootAttributes: {},
        });
    });

    it('normalizes reactive editor props without exposing Tiptap-owned view hooks', () => {
        const dispatchTransaction = vi.fn();
        const editable = vi.fn(() => false);
        const transformPastedHTML = vi.fn((html: string) => html);
        const attributes = vi.fn(() => ({
            'aria-label': 'Configured label',
            class: 'configured-editor',
            role: 'document',
        }));
        const editorProps = {
            attributes,
            dispatchTransaction,
            editable,
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
        expect(resolved.initial).not.toHaveProperty('editable');
        expect(resolved.reactive).not.toHaveProperty('dispatchTransaction');
        expect(resolved.reactive).not.toHaveProperty('editable');
        expect(resolved.reactive).not.toHaveProperty('transformPastedHTML');
        expect(editable).not.toHaveBeenCalled();
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
