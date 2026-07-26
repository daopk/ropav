import { describe, expect, it } from 'vitest';
import { defineComponent, h } from 'vue';

import { flush, mountDom } from '../../../tests/utils/vue';
import Button from '../button/button.vue';
import IconButton from '../icon-button/icon-button.vue';
import ButtonGroup from './button-group.vue';

describe('ButtonGroup', () => {
    it('renders a labelled group around slotted buttons', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        ButtonGroup,
                        {
                            ariaLabel: 'Document actions',
                            describedby: 'document-help',
                            id: 'document-actions',
                        },
                        {
                            default: () => [
                                h(Button, null, { default: () => 'Save' }),
                                h(Button, { variant: 'outline' }, { default: () => 'Publish' }),
                            ],
                        },
                    );
                },
            }),
        );

        await flush();

        const group = container.querySelector('.rp-button-group') as HTMLElement;
        const buttons = [...container.querySelectorAll('button')];

        expect(group.id).toBe('document-actions');
        expect(group.getAttribute('role')).toBe('group');
        expect(group.getAttribute('aria-label')).toBe('Document actions');
        expect(group.getAttribute('aria-describedby')).toBe('document-help');
        expect([...group.classList]).toEqual(['rp-button-group']);
        expect(buttons.map((button) => button.textContent?.trim())).toEqual(['Save', 'Publish']);
    });

    it('supports labelledby and omits empty aria-label', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        ButtonGroup,
                        {
                            labelledby: 'actions-label',
                        },
                        {
                            default: () => h(Button, null, { default: () => 'Archive' }),
                        },
                    );
                },
            }),
        );

        await flush();

        const group = container.querySelector('.rp-button-group') as HTMLElement;

        expect(group.getAttribute('aria-label')).toBeNull();
        expect(group.getAttribute('aria-labelledby')).toBe('actions-label');
    });

    it('adds layout modifiers when requested', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        ButtonGroup,
                        {
                            attached: true,
                            orientation: 'vertical',
                            wrap: true,
                        },
                        {
                            default: () => [
                                h(Button, null, { default: () => 'One' }),
                                h(Button, null, { default: () => 'Two' }),
                            ],
                        },
                    );
                },
            }),
        );

        await flush();

        const group = container.querySelector('.rp-button-group') as HTMLElement;

        expect([...group.classList]).toEqual([
            'rp-button-group',
            'rp-button-group--vertical',
            'rp-button-group--attached',
            'rp-button-group--wrap',
        ]);
    });

    it('groups icon buttons through the same slotted button root class', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        ButtonGroup,
                        {
                            ariaLabel: 'Editor history',
                            attached: true,
                        },
                        {
                            default: () => [
                                h(IconButton, { ariaLabel: 'Undo' }, { default: () => 'U' }),
                                h(IconButton, { ariaLabel: 'Redo' }, { default: () => 'R' }),
                            ],
                        },
                    );
                },
            }),
        );

        await flush();

        const buttons = [...container.querySelectorAll('button')];

        expect(buttons).toHaveLength(2);
        for (const button of buttons) {
            expect(button.classList.contains('rp-button')).toBe(true);
            expect(button.classList.contains('rp-icon-button')).toBe(true);
        }
    });
});
