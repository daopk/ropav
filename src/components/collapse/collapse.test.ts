import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, reactive, ref } from 'vue';

import { click, flush, mountDom, waitTransition } from '../../../tests/utils/vue';
import Collapse from './collapse.vue';
import { useCollapse } from './useCollapse';
import type { CollapseSlotProps, CollapseTriggerSlotProps } from './types';

describe('Collapse', () => {
    it('renders trigger slot props and toggles uncontrolled content', async () => {
        const onUpdate = vi.fn();
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        Collapse,
                        {
                            id: 'details-panel',
                            'onUpdate:open': onUpdate,
                        },
                        {
                            trigger: ({ triggerProps, isOpen }: CollapseTriggerSlotProps) =>
                                h(
                                    'button',
                                    { class: 'trigger', ...triggerProps },
                                    isOpen ? 'Hide details' : 'Show details',
                                ),
                            default: ({ isOpen }: CollapseSlotProps) =>
                                h('p', { class: 'content' }, isOpen ? 'Open body' : 'Closed body'),
                        },
                    );
                },
            }),
        );

        await flush();

        const root = container.querySelector('.rp-collapse') as HTMLElement;
        const trigger = container.querySelector('.trigger') as HTMLButtonElement;
        const content = container.querySelector('#details-panel') as HTMLElement;

        expect([...root.classList]).toEqual(['rp-collapse', 'rp-collapse--closed']);
        expect(root.getAttribute('data-state')).toBe('closed');
        expect(trigger.type).toBe('button');
        expect(trigger.getAttribute('aria-controls')).toBe('details-panel');
        expect(trigger.getAttribute('aria-expanded')).toBe('false');
        expect(content.getAttribute('role')).toBe('region');
        expect(content.getAttribute('aria-hidden')).toBe('true');
        expect(content.style.display).toBe('none');

        click(trigger);
        await flush();

        expect(root.classList.contains('rp-collapse--open')).toBe(true);
        expect(root.getAttribute('data-state')).toBe('open');
        expect(trigger.getAttribute('aria-expanded')).toBe('true');
        expect(content.getAttribute('aria-hidden')).toBeNull();
        expect(content.style.display).not.toBe('none');
        expect(onUpdate).toHaveBeenCalledWith(true);

        click(trigger);
        await waitTransition();

        expect(root.classList.contains('rp-collapse--closed')).toBe(true);
        expect(trigger.getAttribute('aria-expanded')).toBe('false');
        expect(content.style.display).toBe('none');
        expect(onUpdate).toHaveBeenCalledWith(false);
    });

    it('supports controlled open state', async () => {
        const onUpdate = vi.fn();
        const state = reactive({ open: false });
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        Collapse,
                        {
                            id: 'controlled-panel',
                            open: state.open,
                            'onUpdate:open': (open: boolean) => {
                                onUpdate(open);
                                state.open = open;
                            },
                        },
                        {
                            trigger: ({ triggerProps }: CollapseTriggerSlotProps) =>
                                h('button', { class: 'trigger', ...triggerProps }, 'Toggle'),
                            default: () => h('p', 'Controlled body'),
                        },
                    );
                },
            }),
        );

        await flush();

        const trigger = container.querySelector('.trigger') as HTMLButtonElement;
        const content = container.querySelector('#controlled-panel') as HTMLElement;

        expect(content.style.display).toBe('none');

        click(trigger);
        await flush();

        expect(onUpdate).toHaveBeenCalledWith(true);
        expect(trigger.getAttribute('aria-expanded')).toBe('true');
        expect(content.style.display).not.toBe('none');
    });

    it('renders ARIA content props when controlled open', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        Collapse,
                        {
                            ariaLabel: 'Profile details',
                            ariaDescribedby: 'profile-description',
                            ariaLabelledby: 'profile-title',
                            id: 'profile-panel',
                            open: true,
                            role: 'group',
                        },
                        {
                            default: () => h('p', 'Profile body'),
                        },
                    );
                },
            }),
        );

        await flush();

        const root = container.querySelector('.rp-collapse') as HTMLElement;
        const content = container.querySelector('#profile-panel') as HTMLElement;

        expect([...root.classList]).toEqual(['rp-collapse', 'rp-collapse--open']);
        expect(content.getAttribute('role')).toBe('group');
        expect(content.getAttribute('aria-label')).toBe('Profile details');
        expect(content.getAttribute('aria-labelledby')).toBe('profile-title');
        expect(content.getAttribute('aria-describedby')).toBe('profile-description');
        expect(content.style.display).not.toBe('none');
    });

    it('does not toggle when disabled', async () => {
        const onUpdate = vi.fn();
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        Collapse,
                        {
                            disabled: true,
                            id: 'disabled-panel',
                            'onUpdate:open': onUpdate,
                        },
                        {
                            trigger: ({ triggerProps }: CollapseTriggerSlotProps) =>
                                h('button', { class: 'trigger', ...triggerProps }, 'Disabled'),
                            default: () => h('p', 'Disabled body'),
                        },
                    );
                },
            }),
        );

        await flush();

        const root = container.querySelector('.rp-collapse') as HTMLElement;
        const trigger = container.querySelector('.trigger') as HTMLButtonElement;
        const content = container.querySelector('#disabled-panel') as HTMLElement;

        click(trigger);
        await flush();

        expect(root.classList.contains('rp-collapse--disabled')).toBe(true);
        expect(root.getAttribute('data-disabled')).toBe('true');
        expect(trigger.disabled).toBe(true);
        expect(trigger.getAttribute('aria-disabled')).toBe('true');
        expect(trigger.getAttribute('aria-expanded')).toBe('false');
        expect(content.style.display).toBe('none');
        expect(onUpdate).not.toHaveBeenCalled();
    });

    it('can unmount content while closed', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        Collapse,
                        {
                            id: 'lazy-panel',
                            unmountOnExit: true,
                        },
                        {
                            trigger: ({ triggerProps }: CollapseTriggerSlotProps) =>
                                h('button', { class: 'trigger', ...triggerProps }, 'Toggle lazy'),
                            default: () => h('p', 'Lazy body'),
                        },
                    );
                },
            }),
        );

        await flush();

        const trigger = container.querySelector('.trigger') as HTMLButtonElement;

        expect(container.querySelector('#lazy-panel')).toBeNull();

        click(trigger);
        await flush();

        expect(container.querySelector('#lazy-panel')).not.toBeNull();

        click(trigger);
        await waitTransition();

        expect(container.querySelector('#lazy-panel')).toBeNull();
    });

    it('exposes composable props and actions for headless usage', async () => {
        const onOpenChange = vi.fn();
        const container = mountDom(
            defineComponent({
                setup() {
                    const open = ref(false);
                    const disabled = ref(false);
                    const collapse = useCollapse({
                        id: 'headless-panel',
                        open: () => open.value,
                        disabled,
                        ariaLabel: 'Section details',
                        onOpenChange(nextOpen) {
                            onOpenChange(nextOpen);
                            open.value = nextOpen;
                        },
                    });

                    return () =>
                        h(
                            'div',
                            {
                                ...collapse.rootProps.value,
                                class: ['headless-collapse', ...collapse.rootProps.value.class],
                            },
                            [
                                h(
                                    'button',
                                    {
                                        class: 'trigger',
                                        ...collapse.triggerProps.value,
                                    },
                                    'Toggle',
                                ),
                                collapse.shouldRenderContent.value
                                    ? h(
                                          'section',
                                          {
                                              ...collapse.contentProps.value,
                                              class: ['content', collapse.contentProps.value.class],
                                              style: {
                                                  display: collapse.isOpen.value ? '' : 'none',
                                              },
                                          },
                                          'Headless body',
                                      )
                                    : null,
                            ],
                        );
                },
            }),
        );

        await flush();

        const root = container.querySelector('.headless-collapse') as HTMLElement;
        const trigger = container.querySelector('.trigger') as HTMLButtonElement;
        const content = container.querySelector('#headless-panel') as HTMLElement;

        expect([...root.classList]).toEqual([
            'headless-collapse',
            'rp-collapse',
            'rp-collapse--closed',
        ]);
        expect(root.getAttribute('data-state')).toBe('closed');
        expect(trigger.getAttribute('aria-controls')).toBe('headless-panel');
        expect(trigger.getAttribute('aria-expanded')).toBe('false');
        expect(content.getAttribute('role')).toBe('region');
        expect(content.getAttribute('aria-label')).toBe('Section details');
        expect(content.getAttribute('aria-hidden')).toBe('true');
        expect(content.style.display).toBe('none');

        click(trigger);
        await flush();

        expect(onOpenChange).toHaveBeenCalledWith(true);
        expect(root.getAttribute('data-state')).toBe('open');
        expect(trigger.getAttribute('aria-expanded')).toBe('true');
        expect(content.getAttribute('data-state')).toBe('open');
        expect(content.getAttribute('aria-hidden')).toBeNull();
        expect(content.style.display).not.toBe('none');
    });
});
