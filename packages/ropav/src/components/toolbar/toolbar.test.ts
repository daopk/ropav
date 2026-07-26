import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, reactive, ref } from 'vue';

import { flush, keydown, mountDom, waitForAssertion } from '../../../tests/utils/vue';
import Toolbar from './toolbar.vue';
import type { ToolbarProps } from './types';

function mountToolbar(
    props: ToolbarProps = {},
    controls: () => ReturnType<typeof h>[] = () => [
        h('button', { type: 'button' }, 'Undo'),
        h('button', { type: 'button', disabled: true }, 'Redo'),
        h('button', { type: 'button' }, 'Bold'),
    ],
) {
    return mountDom(
        defineComponent({
            render() {
                return h(
                    Toolbar,
                    {
                        ariaLabel: 'Text formatting',
                        ...props,
                    },
                    { default: controls },
                );
            },
        }),
    );
}

describe('Toolbar', () => {
    it('renders an accessible horizontal toolbar and supports the styles interface', async () => {
        const onKeydown = vi.fn();
        const container = mountToolbar({
            id: 'formatting',
            describedby: 'formatting-help',
            classNames: { root: 'custom-toolbar' },
            styles: { root: { padding: '3px' } },
            onKeydown,
        } as ToolbarProps);
        await flush();

        const toolbar = container.querySelector('.rp-toolbar') as HTMLElement;

        expect(toolbar.id).toBe('formatting');
        expect(toolbar.getAttribute('role')).toBe('toolbar');
        expect(toolbar.getAttribute('aria-label')).toBe('Text formatting');
        expect(toolbar.getAttribute('aria-describedby')).toBe('formatting-help');
        expect(toolbar.getAttribute('aria-orientation')).toBe('horizontal');
        expect(toolbar.getAttribute('data-orientation')).toBe('horizontal');
        expect([...toolbar.classList]).toEqual(['rp-toolbar', 'custom-toolbar']);
        expect(toolbar.style.padding).toBe('3px');

        keydown(toolbar.querySelector('button')!, 'PageDown');
        expect(onKeydown).toHaveBeenCalledOnce();
    });

    it('uses labelledby without adding an empty aria-label', async () => {
        const container = mountToolbar({
            ariaLabel: '',
            labelledby: 'formatting-label',
        });
        await flush();

        const toolbar = container.querySelector('.rp-toolbar') as HTMLElement;

        expect(toolbar.getAttribute('aria-label')).toBeNull();
        expect(toolbar.getAttribute('aria-labelledby')).toBe('formatting-label');
    });

    it('keeps one enabled control in the tab order and remembers the last focused control', async () => {
        const container = mountToolbar();
        await flush();

        const buttons = [...container.querySelectorAll('button')] as HTMLButtonElement[];
        expect(buttons.map((button) => button.tabIndex)).toEqual([0, -1, -1]);

        buttons[2]!.focus();

        expect(document.activeElement).toBe(buttons[2]);
        expect(buttons.map((button) => button.tabIndex)).toEqual([-1, -1, 0]);
    });

    it('navigates with horizontal arrows, Home, and End while skipping disabled controls', async () => {
        const container = mountToolbar();
        await flush();

        const buttons = [...container.querySelectorAll('button')] as HTMLButtonElement[];
        buttons[0]!.focus();

        keydown(buttons[0]!, 'ArrowRight');
        expect(document.activeElement).toBe(buttons[2]);

        keydown(buttons[2]!, 'ArrowRight');
        expect(document.activeElement).toBe(buttons[0]);

        keydown(buttons[0]!, 'End');
        expect(document.activeElement).toBe(buttons[2]);

        keydown(buttons[2]!, 'Home');
        expect(document.activeElement).toBe(buttons[0]);

        keydown(buttons[0]!, 'ArrowDown');
        expect(document.activeElement).toBe(buttons[0]);
    });

    it('uses vertical arrows when orientation is vertical', async () => {
        const container = mountToolbar({ orientation: 'vertical' });
        await flush();

        const toolbar = container.querySelector('.rp-toolbar') as HTMLElement;
        const buttons = [...container.querySelectorAll('button')] as HTMLButtonElement[];

        expect([...toolbar.classList]).toEqual(['rp-toolbar', 'rp-toolbar--vertical']);
        expect(toolbar.getAttribute('aria-orientation')).toBe('vertical');

        buttons[0]!.focus();
        keydown(buttons[0]!, 'ArrowDown');
        expect(document.activeElement).toBe(buttons[2]);

        keydown(buttons[2]!, 'ArrowUp');
        expect(document.activeElement).toBe(buttons[0]);

        keydown(buttons[0]!, 'ArrowRight');
        expect(document.activeElement).toBe(buttons[0]);
    });

    it('reconciles the tab stop when controls are added or disabled', async () => {
        const state = reactive({
            controls: [
                { id: 'undo', disabled: false },
                { id: 'bold', disabled: false },
            ],
        });
        const container = mountToolbar({}, () =>
            state.controls.map((control) =>
                h(
                    'button',
                    {
                        key: control.id,
                        type: 'button',
                        disabled: control.disabled,
                        'data-control': control.id,
                    },
                    control.id,
                ),
            ),
        );
        await flush();

        const bold = container.querySelector('[data-control="bold"]') as HTMLButtonElement;
        bold.focus();
        expect(bold.tabIndex).toBe(0);

        state.controls[1]!.disabled = true;
        state.controls.push({ id: 'italic', disabled: false });

        await waitForAssertion(() => {
            const buttons = [...container.querySelectorAll('button')] as HTMLButtonElement[];
            expect(buttons.map((button) => button.tabIndex)).toEqual([0, -1, -1]);
        });
    });

    it('keeps nested toolbars in independent tab sequences', async () => {
        const container = mountToolbar({}, () => [
            h('button', { type: 'button', 'data-control': 'outer' }, 'Outer'),
            h(
                Toolbar,
                { ariaLabel: 'Nested toolbar' },
                {
                    default: () => [
                        h('button', { type: 'button', 'data-control': 'nested-a' }, 'Nested A'),
                        h('button', { type: 'button', 'data-control': 'nested-b' }, 'Nested B'),
                    ],
                },
            ),
        ]);
        await flush();

        const outer = container.querySelector('[data-control="outer"]') as HTMLButtonElement;
        const nestedA = container.querySelector('[data-control="nested-a"]') as HTMLButtonElement;
        const nestedB = container.querySelector('[data-control="nested-b"]') as HTMLButtonElement;

        expect([outer.tabIndex, nestedA.tabIndex, nestedB.tabIndex]).toEqual([0, 0, -1]);

        nestedA.focus();
        keydown(nestedA, 'ArrowRight');

        expect(document.activeElement).toBe(nestedB);
        expect(outer.tabIndex).toBe(0);
    });

    it('exposes the root element and focuses the remembered control', async () => {
        const toolbarRef = ref<{
            nativeElement: HTMLElement | null;
            focus: () => void;
        } | null>(null);
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        Toolbar,
                        {
                            ref: toolbarRef,
                            ariaLabel: 'Document actions',
                        },
                        {
                            default: () => [
                                h('button', { type: 'button' }, 'Save'),
                                h('button', { type: 'button' }, 'Publish'),
                            ],
                        },
                    );
                },
            }),
        );
        await flush();

        const buttons = [...container.querySelectorAll('button')] as HTMLButtonElement[];
        buttons[1]!.focus();
        document.body.focus();
        toolbarRef.value?.focus();

        expect(toolbarRef.value?.nativeElement).toBe(container.querySelector('.rp-toolbar'));
        expect(document.activeElement).toBe(buttons[1]);
    });
});
