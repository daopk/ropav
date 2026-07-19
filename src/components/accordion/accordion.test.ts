import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, reactive } from 'vue';

import { click, flush, keydown, mountDom, waitTransition } from '../../../tests/utils/vue';
import Accordion from './accordion.vue';
import AccordionItem from './accordion-item.vue';
import type { AccordionItemTriggerSlotProps, AccordionModelValue } from './types';

describe('Accordion', () => {
    it('requires an Accordion provider for items', () => {
        expect(() => {
            mountDom(
                defineComponent({
                    render() {
                        return h(
                            AccordionItem,
                            { value: 'standalone', title: 'Standalone' },
                            { default: () => 'Standalone body' },
                        );
                    },
                }),
            );
        }).toThrow('[Ropav] <RpAccordionItem> must be used inside its parent provider component.');
    });

    it('renders a single accordion and toggles uncontrolled items', async () => {
        const onUpdate = vi.fn();
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        Accordion,
                        {
                            defaultValue: 'profile',
                            'onUpdate:modelValue': onUpdate,
                        },
                        {
                            default: () => [
                                h(
                                    AccordionItem,
                                    { id: 'profile-item', value: 'profile', title: 'Profile' },
                                    { default: () => h('p', 'Profile body') },
                                ),
                                h(
                                    AccordionItem,
                                    { id: 'billing-item', value: 'billing', title: 'Billing' },
                                    { default: () => h('p', 'Billing body') },
                                ),
                            ],
                        },
                    );
                },
            }),
        );

        await flush();

        const root = container.querySelector('.rp-accordion') as HTMLElement;
        const buttons = Array.from(
            container.querySelectorAll<HTMLButtonElement>('.rp-accordion-item__trigger'),
        );
        const profileContent = container.querySelector('#profile-item-content') as HTMLElement;
        const billingContent = container.querySelector('#billing-item-content') as HTMLElement;

        expect([...root.classList]).toEqual(['rp-accordion']);
        expect(root.hasAttribute('data-orientation')).toBe(false);
        expect(buttons[0].getAttribute('aria-controls')).toBe('profile-item-content');
        expect(buttons[0].getAttribute('aria-expanded')).toBe('true');
        expect(buttons[1].getAttribute('aria-expanded')).toBe('false');
        expect(profileContent.getAttribute('role')).toBe('region');
        expect(profileContent.getAttribute('aria-labelledby')).toBe('profile-item-trigger');
        expect(profileContent.style.display).not.toBe('none');
        expect(billingContent.style.display).toBe('none');

        click(buttons[1]);
        await flush();

        expect(onUpdate).toHaveBeenLastCalledWith('billing');
        expect(buttons[0].getAttribute('aria-expanded')).toBe('false');
        expect(buttons[1].getAttribute('aria-expanded')).toBe('true');

        click(buttons[1]);
        await waitTransition();

        expect(onUpdate).toHaveBeenLastCalledWith(null);
        expect(buttons[1].getAttribute('aria-expanded')).toBe('false');
        expect(billingContent.style.display).toBe('none');
    });

    it('supports controlled model values', async () => {
        const onUpdate = vi.fn();
        const state = reactive<{ value: AccordionModelValue }>({ value: 'profile' });
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        Accordion,
                        {
                            modelValue: state.value,
                            'onUpdate:modelValue': (value: AccordionModelValue) => {
                                onUpdate(value);
                                state.value = value;
                            },
                        },
                        {
                            default: () => [
                                h(
                                    AccordionItem,
                                    { id: 'profile-item', value: 'profile', title: 'Profile' },
                                    { default: () => h('p', 'Profile body') },
                                ),
                                h(
                                    AccordionItem,
                                    { id: 'settings-item', value: 'settings', title: 'Settings' },
                                    { default: () => h('p', 'Settings body') },
                                ),
                            ],
                        },
                    );
                },
            }),
        );

        await flush();

        const buttons = Array.from(
            container.querySelectorAll<HTMLButtonElement>('.rp-accordion-item__trigger'),
        );

        click(buttons[1]);
        await flush();

        expect(onUpdate).toHaveBeenCalledWith('settings');
        expect(buttons[0].getAttribute('aria-expanded')).toBe('false');
        expect(buttons[1].getAttribute('aria-expanded')).toBe('true');
    });

    it('supports multiple open items', async () => {
        const onUpdate = vi.fn();
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        Accordion,
                        {
                            defaultValue: ['profile'],
                            multiple: true,
                            'onUpdate:modelValue': onUpdate,
                        },
                        {
                            default: () => [
                                h(
                                    AccordionItem,
                                    { value: 'profile', title: 'Profile' },
                                    { default: () => h('p', 'Profile body') },
                                ),
                                h(
                                    AccordionItem,
                                    { value: 'billing', title: 'Billing' },
                                    { default: () => h('p', 'Billing body') },
                                ),
                            ],
                        },
                    );
                },
            }),
        );

        await flush();

        const buttons = Array.from(
            container.querySelectorAll<HTMLButtonElement>('.rp-accordion-item__trigger'),
        );

        click(buttons[1]);
        await flush();

        expect(onUpdate).toHaveBeenLastCalledWith(['profile', 'billing']);
        expect(buttons[0].getAttribute('aria-expanded')).toBe('true');
        expect(buttons[1].getAttribute('aria-expanded')).toBe('true');

        click(buttons[0]);
        await waitTransition();

        expect(onUpdate).toHaveBeenLastCalledWith(['billing']);
        expect(buttons[0].getAttribute('aria-expanded')).toBe('false');
        expect(buttons[1].getAttribute('aria-expanded')).toBe('true');
    });

    it('prevents closing an open item when collapsible is false', async () => {
        const onUpdate = vi.fn();
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        Accordion,
                        {
                            collapsible: false,
                            defaultValue: 'profile',
                            'onUpdate:modelValue': onUpdate,
                        },
                        {
                            default: () =>
                                h(
                                    AccordionItem,
                                    { value: 'profile', title: 'Profile' },
                                    { default: () => h('p', 'Profile body') },
                                ),
                        },
                    );
                },
            }),
        );

        await flush();

        const button = container.querySelector('.rp-accordion-item__trigger') as HTMLButtonElement;

        expect(button.getAttribute('aria-disabled')).toBe('true');

        click(button);
        await flush();

        expect(button.getAttribute('aria-expanded')).toBe('true');
        expect(onUpdate).not.toHaveBeenCalled();
    });

    it('does not toggle disabled groups or disabled items', async () => {
        const disabledGroupUpdate = vi.fn();
        const disabledItemUpdate = vi.fn();

        const disabledGroup = mountDom(
            defineComponent({
                render() {
                    return h(
                        Accordion,
                        {
                            disabled: true,
                            'onUpdate:modelValue': disabledGroupUpdate,
                        },
                        {
                            default: () =>
                                h(
                                    AccordionItem,
                                    { value: 'profile', title: 'Profile' },
                                    { default: () => h('p', 'Profile body') },
                                ),
                        },
                    );
                },
            }),
        );

        const disabledItem = mountDom(
            defineComponent({
                render() {
                    return h(
                        Accordion,
                        { 'onUpdate:modelValue': disabledItemUpdate },
                        {
                            default: () =>
                                h(
                                    AccordionItem,
                                    { disabled: true, value: 'profile', title: 'Profile' },
                                    { default: () => h('p', 'Profile body') },
                                ),
                        },
                    );
                },
            }),
        );

        await flush();

        const groupRoot = disabledGroup.querySelector('.rp-accordion') as HTMLElement;
        const groupButton = disabledGroup.querySelector(
            '.rp-accordion-item__trigger',
        ) as HTMLButtonElement;
        const itemButton = disabledItem.querySelector(
            '.rp-accordion-item__trigger',
        ) as HTMLButtonElement;

        click(groupButton);
        click(itemButton);
        await flush();

        expect(groupRoot.getAttribute('data-disabled')).toBe('');
        expect(groupButton.disabled).toBe(true);
        expect(itemButton.disabled).toBe(true);
        expect(disabledGroupUpdate).not.toHaveBeenCalled();
        expect(disabledItemUpdate).not.toHaveBeenCalled();
    });

    it('can unmount closed item content', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        Accordion,
                        { unmountOnExit: true },
                        {
                            default: () =>
                                h(
                                    AccordionItem,
                                    { id: 'lazy-item', value: 'lazy', title: 'Lazy' },
                                    { default: () => h('p', 'Lazy body') },
                                ),
                        },
                    );
                },
            }),
        );

        await flush();

        const button = container.querySelector('.rp-accordion-item__trigger') as HTMLButtonElement;

        expect(container.querySelector('#lazy-item-content')).toBeNull();

        click(button);
        await flush();

        expect(container.querySelector('#lazy-item-content')).not.toBeNull();

        click(button);
        await waitTransition();

        expect(container.querySelector('#lazy-item-content')).toBeNull();
    });

    it('passes trigger slot props and supports keyboard navigation', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(Accordion, null, {
                        default: () => [
                            h(
                                AccordionItem,
                                { value: 'one', title: 'One' },
                                {
                                    trigger: ({
                                        triggerProps,
                                        isOpen,
                                    }: AccordionItemTriggerSlotProps) =>
                                        h(
                                            'button',
                                            {
                                                ...triggerProps,
                                                class: ['custom-trigger', triggerProps.class],
                                            },
                                            isOpen ? 'Close one' : 'Open one',
                                        ),
                                    default: () => h('p', 'One body'),
                                },
                            ),
                            h(
                                AccordionItem,
                                { disabled: true, value: 'two', title: 'Two' },
                                { default: () => h('p', 'Two body') },
                            ),
                            h(
                                AccordionItem,
                                { value: 'three', title: 'Three' },
                                { default: () => h('p', 'Three body') },
                            ),
                        ],
                    });
                },
            }),
        );

        await flush();

        const buttons = Array.from(
            container.querySelectorAll<HTMLButtonElement>('.rp-accordion-item__trigger'),
        );

        expect(buttons[0].textContent).toBe('Open one');

        buttons[0].focus();
        keydown(buttons[0], 'ArrowDown');
        expect(document.activeElement).toBe(buttons[2]);

        keydown(buttons[2], 'ArrowUp');
        expect(document.activeElement).toBe(buttons[0]);

        keydown(buttons[0], 'ArrowRight');
        expect(document.activeElement).toBe(buttons[0]);

        keydown(buttons[0], 'End');
        expect(document.activeElement).toBe(buttons[2]);

        keydown(buttons[2], 'Home');
        expect(document.activeElement).toBe(buttons[0]);

        click(buttons[0]);
        await flush();

        expect(buttons[0].textContent).toBe('Close one');
    });

    it('keeps keyboard navigation scoped to the nearest accordion', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        Accordion,
                        { defaultValue: 'outer-nested' },
                        {
                            default: () => [
                                h(
                                    AccordionItem,
                                    { id: 'outer-one', value: 'outer-one', title: 'Outer one' },
                                    { default: () => h('p', 'Outer one body') },
                                ),
                                h(
                                    AccordionItem,
                                    {
                                        id: 'outer-nested',
                                        value: 'outer-nested',
                                        title: 'Outer nested',
                                    },
                                    {
                                        default: () =>
                                            h(
                                                Accordion,
                                                { defaultValue: 'inner-one' },
                                                {
                                                    default: () => [
                                                        h(
                                                            AccordionItem,
                                                            {
                                                                id: 'inner-one',
                                                                value: 'inner-one',
                                                                title: 'Inner one',
                                                            },
                                                            {
                                                                default: () =>
                                                                    h('p', 'Inner one body'),
                                                            },
                                                        ),
                                                        h(
                                                            AccordionItem,
                                                            {
                                                                id: 'inner-two',
                                                                value: 'inner-two',
                                                                title: 'Inner two',
                                                            },
                                                            {
                                                                default: () =>
                                                                    h('p', 'Inner two body'),
                                                            },
                                                        ),
                                                    ],
                                                },
                                            ),
                                    },
                                ),
                                h(
                                    AccordionItem,
                                    { id: 'outer-last', value: 'outer-last', title: 'Outer last' },
                                    { default: () => h('p', 'Outer last body') },
                                ),
                            ],
                        },
                    );
                },
            }),
        );

        await flush();

        const outerNested = container.querySelector('#outer-nested-trigger') as HTMLButtonElement;
        const outerLast = container.querySelector('#outer-last-trigger') as HTMLButtonElement;
        const innerOne = container.querySelector('#inner-one-trigger') as HTMLButtonElement;
        const innerTwo = container.querySelector('#inner-two-trigger') as HTMLButtonElement;

        outerNested.focus();
        keydown(outerNested, 'ArrowDown');
        expect(document.activeElement).toBe(outerLast);

        innerOne.focus();
        keydown(innerOne, 'ArrowDown');
        expect(document.activeElement).toBe(innerTwo);
    });
});
