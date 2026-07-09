import { describe, expect, it } from 'vitest';
import { defineComponent, h } from 'vue';

import { flush, mountDom } from '../../../tests/utils/vue';
import Badge from './badge.vue';
import { badgeColors, badgeRadiuses, badgeSizes, badgeVariants } from './types';

describe('Badge', () => {
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

    it('passes through an explicit aria label', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(Badge, { ariaLabel: 'Deployment status' }, { default: () => 'Ready' });
                },
            }),
        );

        await flush();

        const badge = container.querySelector('.rp-badge') as HTMLElement;

        expect(badge.getAttribute('aria-label')).toBe('Deployment status');
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
                        badgeVariants.map((variant) =>
                            h(Badge, { variant }, { default: () => variant }),
                        ),
                    );
                },
            }),
        );

        await flush();

        const badges = [...container.querySelectorAll('.rp-badge')];

        expect(badges).toHaveLength(badgeVariants.length);
        for (const [index, variant] of badgeVariants.entries()) {
            expect([...badges[index].classList]).toEqual(['rp-badge', `rp-badge--${variant}`]);
        }
    });

    it('resolves final color variables for each supported color', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        'div',
                        badgeColors.map((color) => h(Badge, { color }, { default: () => color })),
                    );
                },
            }),
        );

        await flush();

        const badges = [...container.querySelectorAll('.rp-badge')];

        expect(badges).toHaveLength(badgeColors.length);
        for (const [index, color] of badgeColors.entries()) {
            const badge = badges[index] as HTMLElement;

            expect([...badge.classList]).toEqual(['rp-badge']);
            expect(badge.style.getPropertyValue('--_rp-badge-bg')).toBe(
                `var(--rp-color-${color}-filled)`,
            );
            expect(badge.style.getPropertyValue('--_rp-badge-fg')).toBe('var(--rp-color-white)');
            expect(badge.style.getPropertyValue('--_rp-badge-border')).toBe(
                `var(--rp-color-${color}-filled)`,
            );
        }
    });

    it('adds size and radius modifiers', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h('div', [
                        ...badgeSizes.map((size) => h(Badge, { size }, { default: () => size })),
                        ...badgeRadiuses.map((radius) =>
                            h(Badge, { radius }, { default: () => radius }),
                        ),
                    ]);
                },
            }),
        );

        await flush();

        const badges = [...container.querySelectorAll('.rp-badge')];

        expect(badges).toHaveLength(badgeSizes.length + badgeRadiuses.length);
        for (const [index, size] of badgeSizes.entries()) {
            expect([...badges[index].classList]).toEqual(['rp-badge', `rp-badge--size-${size}`]);
        }
        for (const [index, radius] of badgeRadiuses.entries()) {
            expect([...badges[index + badgeSizes.length].classList]).toEqual([
                'rp-badge',
                `rp-badge--radius-${radius}`,
            ]);
        }
    });

    it('uses final CSS variables for custom colors', async () => {
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
        expect(badge.style.getPropertyValue('--_rp-badge-bg')).toBe('#ff3366');
        expect(badge.style.getPropertyValue('--_rp-badge-fg')).toBe('var(--rp-color-white)');
        expect(badge.style.getPropertyValue('--_rp-badge-border')).toBe('#ff3366');
    });

    it('uses readable arbitrary color contrast when autoContrast is enabled', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        Badge,
                        {
                            autoContrast: true,
                            color: '#fab005',
                        },
                        { default: () => 'Contrast' },
                    );
                },
            }),
        );

        await flush();

        const badge = container.querySelector('.rp-badge') as HTMLElement;

        expect(badge.style.getPropertyValue('--_rp-badge-fg')).toBe('var(--rp-color-black)');
    });
});
