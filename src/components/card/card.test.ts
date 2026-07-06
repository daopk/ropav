import { describe, expect, it } from 'vitest';
import { defineComponent, h } from 'vue';

import { flush, mountDom } from '../../../tests/utils/vue';
import Card from './card.vue';

describe('Card', () => {
    const paddings = ['none', 'sm', 'md', 'lg'] as const;
    const radii = ['none', 'xs', 'sm', 'md', 'lg', 'xl'] as const;
    const layers = ['base', 'surface', 'raised'] as const;

    it('renders title, description, and body content', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        Card,
                        {
                            title: 'Revenue',
                            description: 'Month to date',
                        },
                        {
                            default: () => h('span', { class: 'body-content' }, '$24k'),
                        },
                    );
                },
            }),
        );

        await flush();

        const card = container.querySelector('.rp-card') as HTMLElement;

        expect([...card.classList]).toEqual(['rp-card']);
        expect(container.querySelector('.rp-card__title')?.textContent).toBe('Revenue');
        expect(container.querySelector('.rp-card__description')?.textContent).toBe('Month to date');
        expect(container.querySelector('.rp-card__body .body-content')).toBeTruthy();
    });

    it('does not render named slots outside default', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(Card, null, {
                        default: () => h('span', { class: 'body-content' }, 'Body'),
                        media: () => h('img', { alt: 'Chart', class: 'media-content' }),
                        header: () => h('span', { class: 'header-content' }, 'Header'),
                        title: () => h('span', { class: 'title-content' }, 'Title'),
                        description: () =>
                            h('span', { class: 'description-content' }, 'Description'),
                        footer: () => h('button', { class: 'footer-action' }, 'Open'),
                    });
                },
            }),
        );

        await flush();

        expect(container.querySelector('.rp-card__body .body-content')).toBeTruthy();
        expect(container.querySelector('.rp-card__media')).toBeNull();
        expect(container.querySelector('.media-content')).toBeNull();
        expect(container.querySelector('.header-content')).toBeNull();
        expect(container.querySelector('.title-content')).toBeNull();
        expect(container.querySelector('.description-content')).toBeNull();
        expect(container.querySelector('.footer-action')).toBeNull();
        expect(container.querySelector('.rp-card__title')).toBeNull();
        expect(container.querySelector('.rp-card__description')).toBeNull();
        expect(container.querySelector('.rp-card__footer')).toBeNull();
    });

    it('adds layer modifiers when requested', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        'div',
                        layers.map((layer) => h(Card, { layer }, { default: () => layer })),
                    );
                },
            }),
        );

        await flush();

        const cards = [...container.querySelectorAll('.rp-card')];

        expect(cards).toHaveLength(layers.length);
        for (const [index, layer] of layers.entries()) {
            expect([...cards[index].classList]).toEqual(['rp-card', `rp-card--layer-${layer}`]);
        }
    });

    it('adds padding modifiers when requested', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        'div',
                        paddings.map((padding) => h(Card, { padding }, { default: () => padding })),
                    );
                },
            }),
        );

        await flush();

        const cards = [...container.querySelectorAll('.rp-card')];

        expect(cards).toHaveLength(paddings.length);
        for (const [index, padding] of paddings.entries()) {
            expect([...cards[index].classList]).toEqual(['rp-card', `rp-card--padding-${padding}`]);
        }
    });

    it('adds radius modifiers when requested', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        'div',
                        radii.map((radius) => h(Card, { radius }, { default: () => radius })),
                    );
                },
            }),
        );

        await flush();

        const cards = [...container.querySelectorAll('.rp-card')];

        expect(cards).toHaveLength(radii.length);
        for (const [index, radius] of radii.entries()) {
            expect([...cards[index].classList]).toEqual(['rp-card', `rp-card--radius-${radius}`]);
        }
    });

    it('adds a borderless modifier when border is disabled', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(Card, { border: false }, { default: () => 'No border' });
                },
            }),
        );

        await flush();

        const card = container.querySelector('.rp-card') as HTMLElement;

        expect([...card.classList]).toEqual(['rp-card', 'rp-card--borderless']);
    });
});
