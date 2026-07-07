import { describe, expect, it } from 'vitest';
import { defineComponent, h } from 'vue';

import { flush, mountDom } from '../../../tests/utils/vue';
import Badge from './badge.vue';

describe('Badge', () => {
    const colors = [
        'primary',
        'secondary',
        'success',
        'warning',
        'danger',
        'info',
        'neutral',
    ] as const;
    const sizes = ['xs', 'sm', 'md', 'lg', 'xl'] as const;
    const radii = ['none', 'xs', 'sm', 'md', 'lg', 'xl', 'full'] as const;
    const variants = ['solid', 'subtle', 'surface', 'outline'] as const;

    it('renders default slot content', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(Badge, null, { default: () => 'Ready' });
                },
            }),
        );

        await flush();

        const badge = container.querySelector('.rp-badge') as HTMLElement;

        expect([...badge.classList]).toEqual(['rp-badge']);
        expect(badge.getAttribute('aria-label')).toBeNull();
        expect(container.querySelector('.rp-badge__label')?.textContent).toBe('Ready');
    });

    it('renders left and right slots around the label', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(Badge, null, {
                        left: () => h('span', { class: 'left-content' }, 'L'),
                        default: () => 'Ready',
                        right: () => h('span', { class: 'right-content' }, 'R'),
                    });
                },
            }),
        );

        await flush();

        const badge = container.querySelector('.rp-badge') as HTMLElement;

        expect([...badge.classList]).toEqual(['rp-badge']);
        expect(container.querySelector('.rp-badge__left .left-content')).toBeTruthy();
        expect(container.querySelector('.rp-badge__right .right-content')).toBeTruthy();
        expect(container.querySelector('.rp-badge__label')?.textContent).toBe('Ready');
    });

    it('adds a variant modifier for each supported variant', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        'div',
                        variants.map((variant) =>
                            h(Badge, { variant }, { default: () => variant }),
                        ),
                    );
                },
            }),
        );

        await flush();

        const badges = [...container.querySelectorAll('.rp-badge')];

        expect(badges).toHaveLength(variants.length);
        for (const [index, variant] of variants.entries()) {
            expect([...badges[index].classList]).toEqual(['rp-badge', `rp-badge--${variant}`]);
        }
    });

    it('adds a color modifier for each supported color', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        'div',
                        colors.map((color) => h(Badge, { color }, { default: () => color })),
                    );
                },
            }),
        );

        await flush();

        const badges = [...container.querySelectorAll('.rp-badge')];

        expect(badges).toHaveLength(colors.length);
        for (const [index, color] of colors.entries()) {
            const badge = badges[index] as HTMLElement;

            expect([...badge.classList]).toEqual(['rp-badge', `rp-badge--color-${color}`]);
            expect(badge.style.getPropertyValue('--_rp-badge-custom-bg')).toBe('');
        }
    });

    it('adds size and radius modifiers', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h('div', [
                        ...sizes.map((size) => h(Badge, { size }, { default: () => size })),
                        ...radii.map((radius) => h(Badge, { radius }, { default: () => radius })),
                    ]);
                },
            }),
        );

        await flush();

        const badges = [...container.querySelectorAll('.rp-badge')];

        expect(badges).toHaveLength(sizes.length + radii.length);
        for (const [index, size] of sizes.entries()) {
            expect([...badges[index].classList]).toEqual(['rp-badge', `rp-badge--size-${size}`]);
        }
        for (const [index, radius] of radii.entries()) {
            expect([...badges[index + sizes.length].classList]).toEqual([
                'rp-badge',
                `rp-badge--radius-${radius}`,
            ]);
        }
    });

    it('uses CSS variables for custom colors', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(Badge, { color: '#ff3366' }, { default: () => 'Custom' });
                },
            }),
        );

        await flush();

        const badge = container.querySelector('.rp-badge') as HTMLElement;

        expect([...badge.classList]).toEqual(['rp-badge']);
        expect(badge.style.getPropertyValue('--_rp-badge-custom-bg')).toBe('#ff3366');
        expect(badge.style.getPropertyValue('--_rp-badge-custom-fg')).toBe('#ff3366');
    });
});
