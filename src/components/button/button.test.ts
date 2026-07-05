import { describe, expect, it } from 'vitest';
import { defineComponent, h } from 'vue';

import { flush, mountDom } from '../../../tests/utils/vue';
import Button from './button.vue';

describe('Button', () => {
    it('uses button type by default and renders slots', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(Button, null, {
                        default: () => 'Save',
                        prefix: () => h('span', { class: 'prefix-icon' }, 'P'),
                        suffix: () => h('span', { class: 'suffix-icon' }, 'S'),
                    });
                },
            }),
        );

        await flush();

        const button = container.querySelector('button') as HTMLButtonElement;

        expect(button.type).toBe('button');
        expect(button.disabled).toBe(false);
        expect([...button.classList]).toEqual(['rp-button']);
        expect(container.querySelector('.rp-button__prefix')).toBeTruthy();
        expect(container.querySelector('.rp-button__suffix')).toBeTruthy();
        expect(button.textContent).toContain('Save');
    });

    it('disables while loading and hides the prefix slot', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        Button,
                        {
                            loading: true,
                            type: 'submit',
                            variant: 'ghost',
                        },
                        {
                            default: () => 'Delete',
                            prefix: () => h('span', 'Prefix'),
                            suffix: () => h('span', 'Suffix'),
                        },
                    );
                },
            }),
        );

        await flush();

        const button = container.querySelector('button') as HTMLButtonElement;

        expect(button.type).toBe('submit');
        expect(button.disabled).toBe(true);
        expect([...button.classList]).toEqual(['rp-button', 'rp-button--ghost']);
        expect(container.querySelector('.rp-button__spinner')).toBeTruthy();
        expect(container.querySelector('.rp-button__prefix')).toBeNull();
        expect(container.querySelector('.rp-button__suffix')).toBeTruthy();
    });

    it('adds the solid primary style only when requested', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(Button, { variant: 'solid' }, { default: () => 'Save' });
                },
            }),
        );

        await flush();

        const button = container.querySelector('button') as HTMLButtonElement;

        expect([...button.classList]).toEqual(['rp-button', 'rp-button--solid']);
    });

    it('adds color modifiers with variants', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        Button,
                        { color: 'danger', variant: 'solid' },
                        { default: () => 'Delete' },
                    );
                },
            }),
        );

        await flush();

        const button = container.querySelector('button') as HTMLButtonElement;

        expect([...button.classList]).toEqual([
            'rp-button',
            'rp-button--solid',
            'rp-button--color-danger',
        ]);
    });

    it('adds size modifiers when requested', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(Button, { size: 'xl' }, { default: () => 'Save' });
                },
            }),
        );

        await flush();

        const button = container.querySelector('button') as HTMLButtonElement;

        expect([...button.classList]).toEqual(['rp-button', 'rp-button--size-xl']);
    });
});
