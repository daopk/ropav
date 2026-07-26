import { Extension, type Editor as TiptapEditor, type JSONContent } from '@tiptap/core';
import { NodeSelection, Plugin, TextSelection } from '@tiptap/pm/state';
import { StarterKit } from '@tiptap/starter-kit';
import { defineComponent, h, nextTick, ref } from 'vue';
import { describe, expect, it, vi } from 'vitest';

import { mountDomWithApp } from '../../../tests/utils/vue';
import Editor from './editor.vue';
import type { EditorModelValue, EditorProps } from './types';

async function settleEditor() {
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    await nextTick();
    await nextTick();
}

describe('Editor', () => {
    it('emits ready after Tiptap and its extensions are initialized', async () => {
        const lifecycle: string[] = [];
        let initializedAtReady = false;
        const ready = vi.fn((editor: TiptapEditor) => {
            lifecycle.push('ready');
            initializedAtReady = editor.isInitialized;
        });
        const readyProbe = Extension.create({
            name: 'readyProbe',
            onCreate() {
                lifecycle.push('extension');
            },
        });

        mountDomWithApp(
            defineComponent({
                render() {
                    return h(Editor, {
                        extensions: [StarterKit, readyProbe],
                        onReady: ready,
                    });
                },
            }),
        );

        expect(ready).not.toHaveBeenCalled();

        await settleEditor();

        expect(lifecycle).toEqual(['extension', 'ready']);
        expect(initializedAtReady).toBe(true);
        expect(ready).toHaveBeenCalledOnce();
    });

    it('reconciles controlled extension updates before ready', async () => {
        const readyContent = vi.fn();
        const update = vi.fn();
        const createUpdate = Extension.create({
            name: 'createUpdate',
            onCreate() {
                this.editor.commands.setContent('<p>Transient</p>');
            },
        });

        mountDomWithApp(
            defineComponent({
                render() {
                    return h(Editor, {
                        extensions: [StarterKit, createUpdate],
                        modelValue: '<p>Authoritative</p>',
                        onReady: (editor) => readyContent(editor.getHTML()),
                        'onUpdate:modelValue': update,
                    });
                },
            }),
        );

        await settleEditor();

        expect(update).toHaveBeenCalledWith('<p>Transient</p>');
        expect(readyContent).toHaveBeenCalledOnce();
        expect(readyContent).toHaveBeenCalledWith('<p>Authoritative</p>');
    });

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

    it('uses the bundled layered ProseMirror styles by default', async () => {
        mountDomWithApp(Editor);

        await settleEditor();

        expect(document.head.querySelector('style[data-tiptap-style]')).toBeNull();
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

    it('does not add authoritative controlled replacements to Undo history', async () => {
        const content = ref<EditorModelValue>('<p>First document</p>');
        const update = vi.fn();
        const state: { editor: TiptapEditor | null } = { editor: null };
        mountDomWithApp(
            defineComponent({
                setup() {
                    return () =>
                        h(Editor, {
                            modelValue: content.value,
                            onReady: (editor) => {
                                state.editor = editor;
                            },
                            'onUpdate:modelValue': update,
                        });
                },
            }),
        );
        await settleEditor();

        content.value = '<p>Second document</p>';
        await settleEditor();

        expect(state.editor?.commands.undo()).toBe(false);
        await settleEditor();
        expect(state.editor?.getHTML()).toBe('<p>Second document</p>');
        expect(update).not.toHaveBeenCalled();
    });

    it('restores the authoritative content when a controlled update is rejected', async () => {
        const update = vi.fn();
        const state: { editor: TiptapEditor | null } = { editor: null };
        const { container } = mountDomWithApp(
            defineComponent({
                render() {
                    return h(Editor, {
                        modelValue: '<p>Accepted</p>',
                        onReady: (editor) => {
                            state.editor = editor;
                        },
                        'onUpdate:modelValue': update,
                    });
                },
            }),
        );
        await settleEditor();

        state.editor?.commands.setContent('<p>Rejected</p>');
        await settleEditor();

        expect(update).toHaveBeenCalledOnce();
        expect(update).toHaveBeenCalledWith('<p>Rejected</p>');
        expect(container.querySelector('.tiptap')?.innerHTML).toBe('<p>Accepted</p>');
        expect(state.editor?.can().undo()).toBe(false);
    });

    it('preserves accepted Undo history when a later controlled update is rejected', async () => {
        const content = ref<EditorModelValue>('<p>Initial</p>');
        let acceptUpdate = true;
        const state: { editor: TiptapEditor | null } = { editor: null };
        mountDomWithApp(
            defineComponent({
                setup() {
                    return () =>
                        h(Editor, {
                            modelValue: content.value,
                            onReady: (editor) => {
                                state.editor = editor;
                            },
                            'onUpdate:modelValue': (value) => {
                                if (acceptUpdate) content.value = value;
                            },
                        });
                },
            }),
        );
        await settleEditor();

        state.editor?.commands.setContent('<p>Accepted</p>');
        await settleEditor();
        acceptUpdate = false;
        state.editor?.commands.setContent('<p>Rejected</p>');
        await settleEditor();

        expect(state.editor?.getHTML()).toBe('<p>Accepted</p>');
        expect(state.editor?.can().undo()).toBe(true);

        acceptUpdate = true;
        expect(state.editor?.commands.undo()).toBe(true);
        await settleEditor();

        expect(content.value).toBe('<p>Initial</p>');
        expect(state.editor?.getHTML()).toBe('<p>Initial</p>');
    });

    it('restores controlled authority after a suppressed follow-up transaction', async () => {
        const update = vi.fn();
        const state: { editor: TiptapEditor | null } = { editor: null };
        const { container } = mountDomWithApp(
            defineComponent({
                render() {
                    return h(Editor, {
                        modelValue: '<p>Authoritative</p>',
                        onReady: (editor) => {
                            state.editor = editor;
                        },
                        'onUpdate:modelValue': update,
                    });
                },
            }),
        );
        await settleEditor();

        state.editor?.commands.setContent('<p>Proposal</p>');
        state.editor?.commands.setContent('<p>Suppressed</p>', { emitUpdate: false });
        await settleEditor();

        expect(update).toHaveBeenCalledOnce();
        expect(update).toHaveBeenCalledWith('<p>Proposal</p>');
        expect(container.querySelector('.tiptap')?.innerHTML).toBe('<p>Authoritative</p>');
    });

    it('stops reconciling after an extension normalizes authoritative content', async () => {
        let transactionCount = 0;
        const transactionLimit = Extension.create({
            name: 'transactionLimit',
            onTransaction() {
                transactionCount += 1;
                if (transactionCount > 5) {
                    throw new Error('Controlled reconciliation did not settle');
                }
            },
        });
        const state: { editor: TiptapEditor | null } = { editor: null };
        mountDomWithApp(
            defineComponent({
                render() {
                    return h(Editor, {
                        extensions: [StarterKit, transactionLimit],
                        modelValue: '<h1>Authoritative</h1>',
                        onReady: (editor) => {
                            state.editor = editor;
                        },
                    });
                },
            }),
        );
        await settleEditor();

        state.editor?.commands.setContent('<h1>Proposal</h1>');
        await settleEditor();
        const settledTransactionCount = transactionCount;
        await settleEditor();

        expect(state.editor?.getHTML()).toBe('<h1>Authoritative</h1><p></p>');
        expect(transactionCount).toBe(settledTransactionCount);
        expect(transactionCount).toBeLessThanOrEqual(5);
        expect(state.editor?.can().undo()).toBe(false);
        expect(state.editor?.can().redo()).toBe(false);
        expect(state.editor?.can().undo()).toBe(false);
        expect(state.editor?.can().redo()).toBe(false);
    });

    it('reconciles controlled updates from appended extension transactions', async () => {
        const update = vi.fn();
        const state: { editor: TiptapEditor | null } = { editor: null };
        const appendUpdate = Extension.create({
            name: 'appendUpdate',
            addProseMirrorPlugins() {
                return [
                    new Plugin({
                        appendTransaction(transactions, _previousState, nextState) {
                            if (
                                !transactions.some((transaction) =>
                                    transaction.getMeta('appendUpdate'),
                                )
                            ) {
                                return null;
                            }
                            return nextState.tr.insertText('X', 3);
                        },
                    }),
                ];
            },
        });
        mountDomWithApp(
            defineComponent({
                render() {
                    return h(Editor, {
                        extensions: [StarterKit, appendUpdate],
                        modelValue: '<p>abcd</p>',
                        onReady: (editor) => {
                            state.editor = editor;
                        },
                        'onUpdate:modelValue': update,
                    });
                },
            }),
        );
        await settleEditor();

        state.editor?.commands.setTextSelection(3);
        state.editor?.commands.command(({ tr }) => {
            tr.setMeta('appendUpdate', true);
            return true;
        });
        await settleEditor();

        expect(update).toHaveBeenCalledWith('<p>abXcd</p>');
        expect(state.editor?.getHTML()).toBe('<p>abcd</p>');
        expect(state.editor?.state.selection.anchor).toBe(3);
    });

    it('keeps an accepted controlled update in the editor', async () => {
        const content = ref<EditorModelValue>('<p>Initial</p>');
        const update = vi.fn((value: EditorModelValue) => {
            content.value = value;
        });
        const state: { editor: TiptapEditor | null } = { editor: null };
        const { container } = mountDomWithApp(
            defineComponent({
                setup() {
                    return () =>
                        h(Editor, {
                            modelValue: content.value,
                            onReady: (editor) => {
                                state.editor = editor;
                            },
                            'onUpdate:modelValue': update,
                        });
                },
            }),
        );
        await settleEditor();

        state.editor?.commands.setContent('<p>Accepted</p>');
        await settleEditor();

        expect(update).toHaveBeenCalledOnce();
        expect(content.value).toBe('<p>Accepted</p>');
        expect(container.querySelector('.tiptap')?.innerHTML).toBe('<p>Accepted</p>');
    });

    it('restores the proposal selection when a rejected update is accepted later', async () => {
        const content = ref<EditorModelValue>('<p>abcd</p>');
        let proposedContent: EditorModelValue | undefined;
        const state: { editor: TiptapEditor | null } = { editor: null };
        mountDomWithApp(
            defineComponent({
                setup() {
                    return () =>
                        h(Editor, {
                            modelValue: content.value,
                            onReady: (editor) => {
                                state.editor = editor;
                            },
                            'onUpdate:modelValue': (value) => {
                                proposedContent = value;
                            },
                        });
                },
            }),
        );
        await settleEditor();

        state.editor?.commands.setTextSelection(3);
        state.editor?.commands.insertContent('X');
        await settleEditor();

        expect(proposedContent).toBe('<p>abXcd</p>');
        expect(state.editor?.getHTML()).toBe('<p>abcd</p>');
        expect(state.editor?.state.selection.anchor).toBe(3);

        content.value = proposedContent ?? '';
        await settleEditor();

        expect(state.editor?.getHTML()).toBe('<p>abXcd</p>');
        expect(state.editor?.state.selection.anchor).toBe(4);
        expect(state.editor?.state.selection.head).toBe(4);
        expect(state.editor?.can().undo()).toBe(false);
    });

    it('does not reuse rejected proposal history across a controlled-mode boundary', async () => {
        const content = ref<EditorModelValue | undefined>('<p>abcd</p>');
        let proposedContent: EditorModelValue | undefined;
        const state: { editor: TiptapEditor | null } = { editor: null };
        mountDomWithApp(
            defineComponent({
                setup() {
                    return () =>
                        h(Editor, {
                            modelValue: content.value,
                            onReady: (editor) => {
                                state.editor = editor;
                            },
                            'onUpdate:modelValue': (value) => {
                                proposedContent = value;
                            },
                        });
                },
            }),
        );
        await settleEditor();

        state.editor?.commands.setTextSelection(3);
        state.editor?.commands.insertContent('X');
        await settleEditor();

        expect(proposedContent).toBe('<p>abXcd</p>');
        expect(state.editor?.can().undo()).toBe(false);

        content.value = undefined;
        await settleEditor();
        content.value = proposedContent;
        await settleEditor();

        expect(state.editor?.getHTML()).toBe('<p>abXcd</p>');
        expect(state.editor?.can().undo()).toBe(false);
    });

    it('preserves the authoritative selection across synchronous rejected proposals', async () => {
        const state: { editor: TiptapEditor | null } = { editor: null };
        mountDomWithApp(
            defineComponent({
                render() {
                    return h(Editor, {
                        modelValue: '<p>abcd</p>',
                        onReady: (editor) => {
                            state.editor = editor;
                        },
                    });
                },
            }),
        );
        await settleEditor();

        state.editor?.commands.setTextSelection(3);
        state.editor?.commands.insertContent('X');
        state.editor?.commands.insertContent('Y');
        await settleEditor();

        expect(state.editor?.getHTML()).toBe('<p>abcd</p>');
        expect(state.editor?.state.selection.anchor).toBe(3);
        expect(state.editor?.state.selection.head).toBe(3);
    });

    it('keeps reentrant controlled proposals paired with their own history and selection', async () => {
        const content = ref<EditorModelValue>('<p>abcd</p>');
        const proposals: EditorModelValue[] = [];
        let reentered = false;
        const state: { editor: TiptapEditor | null } = { editor: null };
        mountDomWithApp(
            defineComponent({
                setup() {
                    return () =>
                        h(Editor, {
                            modelValue: content.value,
                            onReady: (editor) => {
                                state.editor = editor;
                            },
                            'onUpdate:modelValue': (value) => {
                                proposals.push(value);
                                if (!reentered) {
                                    reentered = true;
                                    content.value = value;
                                    state.editor?.commands.insertContent('Y');
                                } else if (proposals.length > 2) {
                                    content.value = value;
                                }
                            },
                        });
                },
            }),
        );
        await settleEditor();

        state.editor?.commands.setTextSelection(3);
        state.editor?.commands.insertContent('X');
        await settleEditor();

        expect(proposals).toEqual(['<p>abXcd</p>', '<p>abXYcd</p>']);
        expect(state.editor?.getHTML()).toBe('<p>abXcd</p>');
        expect(state.editor?.state.selection.anchor).toBe(4);
        expect(state.editor?.state.selection.head).toBe(4);

        expect(state.editor?.commands.undo()).toBe(true);
        await settleEditor();
        expect(content.value).toBe('<p>abcd</p>');
        expect(state.editor?.getHTML()).toBe('<p>abcd</p>');

        expect(state.editor?.commands.redo()).toBe(true);
        await settleEditor();
        expect(content.value).toBe('<p>abXcd</p>');
        expect(state.editor?.getHTML()).toBe('<p>abXcd</p>');
    });

    it('archives later reentrant proposals without carrying their history forward', async () => {
        const content = ref<EditorModelValue>('<p>abcd</p>');
        const proposals: EditorModelValue[] = [];
        let reentered = false;
        const state: { editor: TiptapEditor | null } = { editor: null };
        mountDomWithApp(
            defineComponent({
                setup() {
                    return () =>
                        h(Editor, {
                            modelValue: content.value,
                            onReady: (editor) => {
                                state.editor = editor;
                            },
                            'onUpdate:modelValue': (value) => {
                                proposals.push(value);
                                if (reentered) return;

                                reentered = true;
                                content.value = value;
                                state.editor?.commands.insertContent('Y');
                            },
                        });
                },
            }),
        );
        await settleEditor();

        state.editor?.commands.setTextSelection(3);
        state.editor?.commands.insertContent('X');
        await settleEditor();

        expect(proposals).toEqual(['<p>abXcd</p>', '<p>abXYcd</p>']);
        expect(state.editor?.getHTML()).toBe('<p>abXcd</p>');

        content.value = proposals[1] ?? '';
        await settleEditor();

        expect(state.editor?.getHTML()).toBe('<p>abXYcd</p>');
        expect(state.editor?.can().undo()).toBe(false);
        expect(state.editor?.can().redo()).toBe(false);
    });

    it('restores sequentially accepted proposal selections', async () => {
        const content = ref<EditorModelValue>('<p>abcd</p>');
        const proposals: EditorModelValue[] = [];
        const state: { editor: TiptapEditor | null } = { editor: null };
        mountDomWithApp(
            defineComponent({
                setup() {
                    return () =>
                        h(Editor, {
                            modelValue: content.value,
                            onReady: (editor) => {
                                state.editor = editor;
                            },
                            'onUpdate:modelValue': (value) => proposals.push(value),
                        });
                },
            }),
        );
        await settleEditor();

        state.editor?.commands.setTextSelection(3);
        state.editor?.commands.insertContent('X');
        state.editor?.commands.insertContent('Y');
        await settleEditor();

        expect(proposals).toEqual(['<p>abXcd</p>', '<p>abXYcd</p>']);
        expect(state.editor?.getHTML()).toBe('<p>abcd</p>');

        content.value = proposals[0] ?? '';
        await settleEditor();

        expect(state.editor?.getHTML()).toBe('<p>abXcd</p>');
        expect(state.editor?.state.selection.anchor).toBe(4);

        content.value = proposals[1] ?? '';
        await settleEditor();

        expect(state.editor?.getHTML()).toBe('<p>abXYcd</p>');
        expect(state.editor?.state.selection.anchor).toBe(5);
    });

    it('retains intermediate proposals when editing returns to authority', async () => {
        const content = ref<EditorModelValue>('<p>abcd</p>');
        const proposals: EditorModelValue[] = [];
        const state: { editor: TiptapEditor | null } = { editor: null };
        mountDomWithApp(
            defineComponent({
                setup() {
                    return () =>
                        h(Editor, {
                            modelValue: content.value,
                            onReady: (editor) => {
                                state.editor = editor;
                            },
                            'onUpdate:modelValue': (value) => proposals.push(value),
                        });
                },
            }),
        );
        await settleEditor();

        state.editor?.commands.setTextSelection(3);
        state.editor?.commands.insertContent('X');
        state.editor?.commands.undo();
        await settleEditor();

        expect(proposals[0]).toBe('<p>abXcd</p>');
        expect(state.editor?.getHTML()).toBe('<p>abcd</p>');

        content.value = proposals[0] ?? '';
        await settleEditor();

        expect(state.editor?.getHTML()).toBe('<p>abXcd</p>');
        expect(state.editor?.state.selection.anchor).toBe(4);
    });

    it('restores backward text selections after a controlled rejection', async () => {
        const state: { editor: TiptapEditor | null } = { editor: null };
        mountDomWithApp(
            defineComponent({
                render() {
                    return h(Editor, {
                        modelValue: '<p>abcd</p>',
                        onReady: (editor) => {
                            state.editor = editor;
                        },
                    });
                },
            }),
        );
        await settleEditor();

        state.editor?.commands.command(({ tr }) => {
            tr.setSelection(TextSelection.create(tr.doc, 4, 2));
            return true;
        });
        state.editor?.commands.insertContent('X');
        await settleEditor();

        expect(state.editor?.getHTML()).toBe('<p>abcd</p>');
        expect(state.editor?.state.selection.anchor).toBe(4);
        expect(state.editor?.state.selection.head).toBe(2);
    });

    it('restores node selections after a controlled rejection', async () => {
        const content = {
            type: 'doc',
            content: [
                { type: 'horizontalRule' },
                {
                    type: 'paragraph',
                    content: [{ type: 'text', text: 'After' }],
                },
            ],
        } satisfies JSONContent;
        const state: { editor: TiptapEditor | null } = { editor: null };
        mountDomWithApp(
            defineComponent({
                render() {
                    return h(Editor, {
                        modelValue: content,
                        output: 'json',
                        onReady: (editor) => {
                            state.editor = editor;
                        },
                    });
                },
            }),
        );
        await settleEditor();

        state.editor?.commands.setNodeSelection(0);
        expect(state.editor?.state.selection).toBeInstanceOf(NodeSelection);
        state.editor?.commands.deleteSelection();
        await settleEditor();

        expect(state.editor?.getJSON()).toEqual(content);
        expect(state.editor?.state.selection).toBeInstanceOf(NodeSelection);
        expect(state.editor?.state.selection.toJSON()).toEqual({ type: 'node', anchor: 0 });
    });

    it('routes control attributes to the editable element and preserves its role', async () => {
        const ariaLabel = ref('Article body');
        const editorProps = ref({
            attributes: {
                'data-editor-state': 'initial',
                role: 'document',
            },
        });
        const { container } = mountDomWithApp(
            defineComponent({
                setup() {
                    return () =>
                        h(Editor, {
                            class: 'custom-root',
                            style: { borderWidth: '2px' },
                            'aria-label': ariaLabel.value,
                            'aria-describedby': 'article-hint',
                            'aria-invalid': 'true',
                            tabindex: -1,
                            editorProps: editorProps.value,
                        });
                },
            }),
        );
        await settleEditor();

        const root = container.querySelector('.rp-editor') as HTMLElement;
        const editable = container.querySelector('.tiptap') as HTMLElement;
        expect(root.classList.contains('custom-root')).toBe(true);
        expect(root.style.borderWidth).toBe('2px');
        expect(root.hasAttribute('aria-label')).toBe(false);
        expect(root.hasAttribute('tabindex')).toBe(false);
        expect(editable.getAttribute('role')).toBe('textbox');
        expect(editable.getAttribute('aria-label')).toBe('Article body');
        expect(editable.getAttribute('aria-describedby')).toBe('article-hint');
        expect(editable.getAttribute('aria-invalid')).toBe('true');
        expect(editable.getAttribute('tabindex')).toBe('-1');
        expect(editable.getAttribute('data-editor-state')).toBe('initial');

        ariaLabel.value = 'Updated article body';
        editorProps.value = {
            attributes: {
                'data-editor-state': 'updated',
                role: 'document',
            },
        };
        await settleEditor();

        expect(editable.getAttribute('role')).toBe('textbox');
        expect(editable.getAttribute('aria-label')).toBe('Updated article body');
        expect(editable.getAttribute('data-editor-state')).toBe('updated');
        expect(editable.classList.contains('tiptap')).toBe(true);
    });

    it('keeps functional editor attributes across editable changes', async () => {
        const editable = ref(true);
        const editorProps: NonNullable<EditorProps['editorProps']> = {
            attributes: (state) => ({
                'aria-description': 'Dynamic editor',
                'data-doc-size': String(state.doc.content.size),
            }),
        };
        const { container } = mountDomWithApp(
            defineComponent({
                setup() {
                    return () =>
                        h(Editor, {
                            defaultValue: '<p>x</p>',
                            editable: editable.value,
                            editorProps,
                        });
                },
            }),
        );
        await settleEditor();

        const editorElement = container.querySelector('.tiptap');
        expect(editorElement?.getAttribute('aria-description')).toBe('Dynamic editor');
        expect(editorElement?.getAttribute('data-doc-size')).toBe('3');

        editable.value = false;
        await settleEditor();

        expect(editorElement?.getAttribute('contenteditable')).toBe('false');
        expect(editorElement?.getAttribute('aria-description')).toBe('Dynamic editor');
        expect(editorElement?.getAttribute('data-doc-size')).toBe('3');
    });

    it('reactively recomposes Tiptap paste transforms', async () => {
        const editorProps = ref<NonNullable<EditorProps['editorProps']>>({
            transformPastedHTML: (html) => `one:${html}`,
        });
        const state: { editor: TiptapEditor | null } = { editor: null };
        mountDomWithApp(
            defineComponent({
                setup() {
                    return () =>
                        h(Editor, {
                            editorProps: editorProps.value,
                            onReady: (editor) => {
                                state.editor = editor;
                            },
                        });
                },
            }),
        );
        await settleEditor();

        expect(transformPastedHTML(state.editor, 'input')).toBe('one:input');

        editorProps.value = {
            transformPastedHTML: (html) => `two:${html}`,
        };
        await settleEditor();

        expect(transformPastedHTML(state.editor, 'input')).toBe('two:input');
    });

    it('removes reactive editor props that are no longer configured', async () => {
        const handleKeyDown = vi.fn(() => true);
        const editorProps = ref<NonNullable<EditorProps['editorProps']>>({
            handleKeyDown,
        });
        const { container } = mountDomWithApp(
            defineComponent({
                setup() {
                    return () =>
                        h(Editor, {
                            editorProps: editorProps.value,
                        });
                },
            }),
        );
        await settleEditor();

        const editable = container.querySelector('.tiptap') as HTMLElement;
        editable.dispatchEvent(createKeydownEvent());
        expect(handleKeyDown).toHaveBeenCalledOnce();

        editorProps.value = {};
        await settleEditor();
        editable.dispatchEvent(createKeydownEvent());

        expect(handleKeyDown).toHaveBeenCalledOnce();
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

    it('does not emit ready after teardown wins the create race', async () => {
        const ready = vi.fn();
        const destroyed = vi.fn();
        const mounted = mountDomWithApp(
            defineComponent({
                render() {
                    return h(Editor, {
                        onReady: ready,
                        onDestroy: destroyed,
                    });
                },
            }),
        );

        mounted.unmount();
        await settleEditor();

        expect(ready).not.toHaveBeenCalled();
        expect(destroyed).toHaveBeenCalledOnce();
        expect((destroyed.mock.calls[0]?.[0] as TiptapEditor | undefined)?.isDestroyed).toBe(true);
    });
});

function transformPastedHTML(editor: TiptapEditor | null, html: string) {
    if (!editor) return undefined;
    return editor.view.props.transformPastedHTML?.(html, editor.view);
}

function createKeydownEvent() {
    return new KeyboardEvent('keydown', {
        bubbles: true,
        cancelable: true,
        key: 'a',
    });
}
