import { defineComponent, h, nextTick, ref } from 'vue';
import { describe, expect, it, vi } from 'vitest';

import { mountDomWithApp } from '../../tests/utils/vue';
import Editor from './editor.vue';
import type { Editor as TiptapEditor, JSONContent } from '@tiptap/core';

async function settleEditor() {
    await nextTick();
    await nextTick();
}

describe('Editor', () => {
    it('mounts Tiptap directly into the Vapor-owned host', async () => {
        const ready = vi.fn();
        const { container } = mountDomWithApp(
            defineComponent({
                render() {
                    return h(Editor, {
                        modelValue: '<p>Hello editor</p>',
                        onReady: ready,
                    });
                },
            }),
        );

        await settleEditor();

        const editable = container.querySelector('[contenteditable="true"]');
        expect(editable?.innerHTML).toBe('<p>Hello editor</p>');
        expect(ready).toHaveBeenCalledOnce();
    });

    it('emits HTML updates through v-model', async () => {
        const update = vi.fn();
        const state: { editor: TiptapEditor | null } = { editor: null };
        mountDomWithApp(
            defineComponent({
                render() {
                    return h(Editor, {
                        modelValue: '<p>Initial</p>',
                        onReady: (editor) => {
                            state.editor = editor;
                        },
                        'onUpdate:modelValue': update,
                    });
                },
            }),
        );
        await settleEditor();

        state.editor?.commands.setContent('<p>Changed</p>');
        await settleEditor();

        expect(update).toHaveBeenLastCalledWith('<p>Changed</p>');
    });

    it('supports JSON output', async () => {
        const update = vi.fn();
        const state: { editor: TiptapEditor | null } = { editor: null };
        mountDomWithApp(
            defineComponent({
                render() {
                    return h(Editor, {
                        defaultValue: '<p>Initial</p>',
                        output: 'json',
                        onReady: (editor) => {
                            state.editor = editor;
                        },
                        'onUpdate:modelValue': update,
                    });
                },
            }),
        );
        await settleEditor();

        state.editor?.commands.setContent('<p>JSON value</p>');
        await settleEditor();

        expect(update).toHaveBeenLastCalledWith({
            type: 'doc',
            content: [
                {
                    type: 'paragraph',
                    content: [{ type: 'text', text: 'JSON value' }],
                },
            ],
        } satisfies JSONContent);
    });

    it('synchronizes controlled content and editable state without update loops', async () => {
        const content = ref('<p>First</p>');
        const editable = ref(true);
        const update = vi.fn();
        const { container } = mountDomWithApp(
            defineComponent({
                setup() {
                    return () =>
                        h(Editor, {
                            modelValue: content.value,
                            editable: editable.value,
                            'onUpdate:modelValue': update,
                        });
                },
            }),
        );
        await settleEditor();

        content.value = '<p>External</p>';
        editable.value = false;
        await settleEditor();

        const editorElement = container.querySelector('.tiptap');
        expect(editorElement?.innerHTML).toBe('<p>External</p>');
        expect(editorElement?.getAttribute('contenteditable')).toBe('false');
        expect(container.querySelector('.rp-editor')?.hasAttribute('data-readonly')).toBe(true);
        expect(update).not.toHaveBeenCalled();
    });

    it('destroys the Tiptap instance during component teardown', async () => {
        const destroyed = vi.fn();
        const state: { editor: TiptapEditor | null } = { editor: null };
        const mounted = mountDomWithApp(
            defineComponent({
                render() {
                    return h(Editor, {
                        onReady: (editor) => {
                            state.editor = editor;
                        },
                        onDestroy: destroyed,
                    });
                },
            }),
        );
        await settleEditor();

        mounted.unmount();

        expect(state.editor?.isDestroyed).toBe(true);
        expect(destroyed).toHaveBeenCalledWith(state.editor);
    });
});
