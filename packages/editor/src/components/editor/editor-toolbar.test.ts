import { type Editor as TiptapEditor } from '@tiptap/core';
import { StarterKit } from '@tiptap/starter-kit';
import { defineComponent, h, nextTick } from 'vue';
import { describe, expect, it, vi } from 'vitest';

import { mountDomWithApp } from '../../../tests/utils/vue';
import Editor from './editor.vue';
import type { EditorProps, EditorToolbarSlotProps } from './types';

async function settleEditor() {
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    await nextTick();
    await nextTick();
}

describe('Editor toolbar', () => {
    it('renders by default and supports visibility, labels, and styles API controls', async () => {
        const enabled = mountEditor({
            toolbarAriaLabel: 'Article formatting',
            classNames: { toolbar: 'custom-toolbar' },
            styles: { toolbar: { padding: '3px' } },
        });
        const disabled = mountEditor({ toolbar: false });
        const readonly = mountEditor({ editable: false });
        await settleEditor();

        const toolbar = enabled.container.querySelector('[role="toolbar"]') as HTMLElement;
        expect(toolbar.getAttribute('aria-label')).toBe('Article formatting');
        expect(toolbar.classList.contains('rp-editor__toolbar')).toBe(true);
        expect(toolbar.classList.contains('custom-toolbar')).toBe(true);
        expect(toolbar.style.padding).toBe('3px');
        expect(toolbar.querySelector('[aria-label="Bold"]')).not.toBeNull();
        expect(disabled.container.querySelector('[role="toolbar"]')).toBeNull();
        expect(readonly.container.querySelector('[role="toolbar"]')).toBeNull();
    });

    it('uses one tab stop and arrow keys to move between formatting controls', async () => {
        const mounted = mountEditor();
        await settleEditor();

        const toolbar = mounted.container.querySelector('[role="toolbar"]') as HTMLElement;
        const select = toolbar.querySelector('select') as HTMLSelectElement;
        const bold = toolbar.querySelector('[aria-label="Bold"]') as HTMLButtonElement;
        const controls = [...toolbar.querySelectorAll('select, button')] as HTMLElement[];

        expect(controls.filter((control) => control.tabIndex === 0)).toEqual([select]);

        select.focus();
        select.dispatchEvent(
            new KeyboardEvent('keydown', {
                key: 'ArrowRight',
                bubbles: true,
                cancelable: true,
            }),
        );

        expect(document.activeElement).toBe(bold);
        expect(controls.filter((control) => control.tabIndex === 0)).toEqual([bold]);
    });

    it.each([
        ['Bold', 'bold'],
        ['Italic', 'italic'],
        ['Underline', 'underline'],
        ['Strikethrough', 'strike'],
        ['Inline code', 'code'],
    ] as const)('runs the %s inline command and tracks its active state', async (label, mark) => {
        const mounted = mountEditor({ defaultValue: '<p>Alpha</p>' });
        await settleEditor();

        mounted.state.editor?.commands.setTextSelection({ from: 1, to: 6 });
        await settleEditor();

        const button = mounted.container.querySelector(
            `button[aria-label="${label}"]`,
        ) as HTMLButtonElement;
        const pointerDown = clickToolbarButton(button);
        await settleEditor();
        await new Promise<void>((resolve) => setTimeout(resolve, 20));

        expect(pointerDown.defaultPrevented).toBe(true);
        expect(mounted.state.editor?.isActive(mark)).toBe(true);
        expect(button.getAttribute('aria-pressed')).toBe('true');
        expect(document.activeElement).toBe(mounted.container.querySelector('.tiptap'));
        expect(mounted.update).toHaveBeenCalled();
    });

    it('changes the active text block from the native selector', async () => {
        const mounted = mountEditor({ defaultValue: '<p>Heading text</p>' });
        await settleEditor();

        const select = mounted.container.querySelector(
            'select[aria-label="Text style"]',
        ) as HTMLSelectElement;
        expect(select.value).toBe('paragraph');

        select.value = 'heading-2';
        select.dispatchEvent(new Event('change', { bubbles: true }));
        await settleEditor();
        await new Promise<void>((resolve) => setTimeout(resolve, 20));

        expect(mounted.state.editor?.getHTML()).toBe('<h2>Heading text</h2><p></p>');
        expect(select.value).toBe('heading-2');
        expect(document.activeElement).toBe(mounted.container.querySelector('.tiptap'));
    });

    it.each([
        ['Bullet list', 'bulletList'],
        ['Ordered list', 'orderedList'],
        ['Blockquote', 'blockquote'],
        ['Code block', 'codeBlock'],
    ] as const)('runs the %s block command', async (label, node) => {
        const mounted = mountEditor({ defaultValue: '<p>Alpha</p>' });
        await settleEditor();

        mounted.state.editor?.commands.setTextSelection(2);
        await settleEditor();
        const button = mounted.container.querySelector(
            `button[aria-label="${label}"]`,
        ) as HTMLButtonElement;
        clickToolbarButton(button);
        await settleEditor();

        expect(mounted.state.editor?.isActive(node)).toBe(true);
        expect(button.getAttribute('aria-pressed')).toBe('true');
    });

    it('inserts a horizontal rule and updates undo and redo availability', async () => {
        const mounted = mountEditor({ defaultValue: '<p>Alpha</p>' });
        await settleEditor();

        const undo = mounted.container.querySelector(
            'button[aria-label="Undo"]',
        ) as HTMLButtonElement;
        const redo = mounted.container.querySelector(
            'button[aria-label="Redo"]',
        ) as HTMLButtonElement;
        expect(undo.disabled).toBe(true);
        expect(redo.disabled).toBe(true);

        clickToolbarButton(
            mounted.container.querySelector(
                'button[aria-label="Horizontal rule"]',
            ) as HTMLButtonElement,
        );
        await settleEditor();

        expect(mounted.state.editor?.getHTML()).toContain('<hr>');
        expect(undo.disabled).toBe(false);

        clickToolbarButton(undo);
        await settleEditor();
        expect(mounted.state.editor?.getHTML()).not.toContain('<hr>');
        expect(redo.disabled).toBe(false);

        clickToolbarButton(redo);
        await settleEditor();
        expect(mounted.state.editor?.getHTML()).toContain('<hr>');
    });

    it('hides actions and heading levels omitted by the configured extensions', async () => {
        const mounted = mountEditor({
            extensions: [
                StarterKit.configure({
                    bold: false,
                    heading: { levels: [1, 2] },
                    underline: false,
                }),
            ],
        });
        await settleEditor();

        expect(mounted.container.querySelector('[aria-label="Bold"]')).toBeNull();
        expect(mounted.container.querySelector('[aria-label="Underline"]')).toBeNull();
        expect(mounted.container.querySelector('[aria-label="Italic"]')).not.toBeNull();
        expect(mounted.container.querySelector('option[value="heading-2"]')).not.toBeNull();
        expect(mounted.container.querySelector('option[value="heading-3"]')).toBeNull();
    });

    it('provides reactive state and a command runner to a replacement toolbar slot', async () => {
        const slotState: { current: EditorToolbarSlotProps | null } = { current: null };
        const update = vi.fn();
        const { container } = mountDomWithApp(
            defineComponent({
                render() {
                    return h(
                        Editor,
                        {
                            defaultValue: '<p>Alpha</p>',
                            'onUpdate:modelValue': update,
                        },
                        {
                            toolbar: (props: EditorToolbarSlotProps) => {
                                slotState.current = props;
                                return h(
                                    'button',
                                    {
                                        type: 'button',
                                        'aria-label': 'Custom bold',
                                        'aria-pressed': props.state.actions.bold.active,
                                        disabled: props.state.actions.bold.disabled,
                                        onMousedown: (event: MouseEvent) => event.preventDefault(),
                                        onClick: () => props.run('bold'),
                                    },
                                    'Custom bold',
                                );
                            },
                        },
                    );
                },
            }),
        );
        await settleEditor();

        expect(container.querySelector('[aria-label="Bold"]')).toBeNull();
        expect(slotState.current?.editor).not.toBeNull();
        slotState.current?.editor?.commands.setTextSelection({ from: 1, to: 6 });
        await settleEditor();

        const button = container.querySelector(
            'button[aria-label="Custom bold"]',
        ) as HTMLButtonElement;
        clickToolbarButton(button);
        await settleEditor();

        expect(slotState.current?.state.actions.bold.active).toBe(true);
        expect(button.getAttribute('aria-pressed')).toBe('true');
        expect(update).toHaveBeenCalled();
    });
});

function mountEditor(props: EditorProps = {}) {
    const state: { editor: TiptapEditor | null } = { editor: null };
    const update = vi.fn();
    const mounted = mountDomWithApp(
        defineComponent({
            render() {
                return h(Editor, {
                    ...props,
                    onReady: (editor) => {
                        state.editor = editor;
                    },
                    'onUpdate:modelValue': update,
                });
            },
        }),
    );

    return { ...mounted, state, update };
}

function clickToolbarButton(button: HTMLButtonElement) {
    const pointerDown = new MouseEvent('mousedown', {
        bubbles: true,
        cancelable: true,
    });
    button.dispatchEvent(pointerDown);
    button.click();
    return pointerDown;
}
