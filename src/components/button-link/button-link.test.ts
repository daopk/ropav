import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';

import { flush, mountDom } from '../../../tests/utils/vue';
import ButtonLink from './button-link.vue';

describe('ButtonLink', () => {
    const colors = [
        'primary',
        'secondary',
        'success',
        'warning',
        'danger',
        'info',
        'neutral',
    ] as const;
    const radii = ['xs', 'sm', 'md', 'lg', 'xl'] as const;
    const variants = ['solid', 'subtle', 'surface', 'outline', 'ghost', 'plain'] as const;

    it('renders an anchor with link attributes and slots', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        ButtonLink,
                        {
                            href: '/docs',
                            hreflang: 'en',
                            target: '_blank',
                        },
                        {
                            default: () => 'Docs',
                            left: () => h('span', { class: 'left-icon' }, 'L'),
                            right: () => h('span', { class: 'right-icon' }, 'R'),
                        },
                    );
                },
            }),
        );

        await flush();

        const link = container.querySelector('a') as HTMLAnchorElement;

        expect(link.getAttribute('href')).toBe('/docs');
        expect(link.getAttribute('target')).toBe('_blank');
        expect(link.getAttribute('rel')).toBe('noopener noreferrer');
        expect(link.getAttribute('hreflang')).toBe('en');
        expect(link.getAttribute('aria-disabled')).toBeNull();
        expect(link.getAttribute('aria-busy')).toBeNull();
        expect([...link.classList]).toEqual(['rp-button']);
        expect(container.querySelector('.rp-button__left .left-icon')).toBeTruthy();
        expect(container.querySelector('.rp-button__right .right-icon')).toBeTruthy();
        expect(link.textContent).toContain('Docs');
    });

    it('preserves an explicit rel value', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        ButtonLink,
                        {
                            href: '/terms',
                            rel: 'nofollow',
                            target: '_blank',
                        },
                        { default: () => 'Terms' },
                    );
                },
            }),
        );

        await flush();

        const link = container.querySelector('a') as HTMLAnchorElement;

        expect(link.getAttribute('rel')).toBe('nofollow');
    });

    it('supports download links', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        ButtonLink,
                        {
                            download: 'report.csv',
                            href: '/report.csv',
                        },
                        { default: () => 'Download' },
                    );
                },
            }),
        );

        await flush();

        const link = container.querySelector('a') as HTMLAnchorElement;

        expect(link.getAttribute('download')).toBe('report.csv');
    });

    it('disables navigation and visually hides content while loading', async () => {
        const onClick = vi.fn();
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        ButtonLink,
                        {
                            href: '/delete',
                            loading: true,
                            target: '_blank',
                            variant: 'ghost',
                            onClick,
                        },
                        {
                            default: () => 'Delete',
                            left: () => h('span', 'Left'),
                            right: () => h('span', 'Right'),
                        },
                    );
                },
            }),
        );

        await flush();

        const link = container.querySelector('a') as HTMLAnchorElement;
        const click = new MouseEvent('click', { bubbles: true, cancelable: true });

        link.dispatchEvent(click);

        expect(link.hasAttribute('href')).toBe(false);
        expect(link.hasAttribute('target')).toBe(false);
        expect(link.getAttribute('aria-disabled')).toBe('true');
        expect(link.getAttribute('aria-busy')).toBe('true');
        expect(link.getAttribute('tabindex')).toBe('-1');
        expect([...link.classList]).toEqual([
            'rp-button',
            'rp-button--ghost',
            'rp-button--disabled',
            'rp-button--loading',
        ]);
        expect(click.defaultPrevented).toBe(true);
        expect(onClick).not.toHaveBeenCalled();
        expect(container.querySelector('svg.rp-button__spinner')).toBeTruthy();
        expect(container.querySelector('.rp-button__content')?.getAttribute('aria-hidden')).toBe(
            'true',
        );
        expect(container.querySelector('.rp-button__left')).toBeTruthy();
        expect(container.querySelector('.rp-button__right')).toBeTruthy();
    });

    it('renders a custom loading slot when provided', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        ButtonLink,
                        {
                            href: '/save',
                            loading: true,
                        },
                        {
                            default: () => 'Save',
                            loading: () => h('span', { class: 'loading-dots' }, '...'),
                        },
                    );
                },
            }),
        );

        await flush();

        const loading = container.querySelector('.rp-button__loading');

        expect(loading?.getAttribute('aria-hidden')).toBe('true');
        expect(container.querySelector('.loading-dots')).toBeTruthy();
        expect(container.querySelector('svg.rp-button__spinner')).toBeNull();
        expect(container.querySelector('.rp-button__content')?.getAttribute('aria-hidden')).toBe(
            'true',
        );
    });

    it('adds color, size, radius, and variant modifiers when requested', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        ButtonLink,
                        {
                            color: 'danger',
                            href: '/delete',
                            radius: 'lg',
                            size: 'sm',
                            variant: 'solid',
                        },
                        { default: () => 'Delete' },
                    );
                },
            }),
        );

        await flush();

        const link = container.querySelector('a') as HTMLAnchorElement;

        expect([...link.classList]).toEqual([
            'rp-button',
            'rp-button--solid',
            'rp-button--color-danger',
            'rp-button--size-sm',
            'rp-button--radius-lg',
        ]);
    });

    it('adds a variant modifier for each supported variant', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        'div',
                        variants.map((variant) =>
                            h(
                                ButtonLink,
                                { href: `/${variant}`, variant },
                                { default: () => variant },
                            ),
                        ),
                    );
                },
            }),
        );

        await flush();

        const links = [...container.querySelectorAll('a')];

        expect(links).toHaveLength(variants.length);
        for (const [index, variant] of variants.entries()) {
            expect([...links[index].classList]).toEqual(['rp-button', `rp-button--${variant}`]);
        }
    });

    it('adds a color modifier for each supported color', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        'div',
                        colors.map((color) =>
                            h(ButtonLink, { color, href: `/${color}` }, { default: () => color }),
                        ),
                    );
                },
            }),
        );

        await flush();

        const links = [...container.querySelectorAll('a')];

        expect(links).toHaveLength(colors.length);
        for (const [index, color] of colors.entries()) {
            const link = links[index] as HTMLElement;

            expect([...link.classList]).toEqual(['rp-button', `rp-button--color-${color}`]);
            expect(link.style.getPropertyValue('--_rp-button-custom-color')).toBe('');
        }
    });

    it('sets inline custom color variables for arbitrary color values', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        ButtonLink,
                        {
                            color: '#ff3366',
                            href: '/custom',
                            variant: 'solid',
                        },
                        { default: () => 'Custom' },
                    );
                },
            }),
        );

        await flush();

        const link = container.querySelector('a') as HTMLAnchorElement;

        expect([...link.classList]).toEqual(['rp-button', 'rp-button--solid']);
        expect(link.style.getPropertyValue('--_rp-button-custom-color')).toBe('#ff3366');
        expect(link.style.getPropertyValue('--_rp-button-custom-fg')).toBe('#ff3366');
        expect(link.style.getPropertyValue('--_rp-button-custom-on')).toBe(
            'var(--rp-color-on-primary)',
        );
    });

    it('adds a radius modifier for each supported radius', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        'div',
                        radii.map((radius) =>
                            h(
                                ButtonLink,
                                { href: `/${radius}`, radius },
                                { default: () => radius },
                            ),
                        ),
                    );
                },
            }),
        );

        await flush();

        const links = [...container.querySelectorAll('a')];

        expect(links).toHaveLength(radii.length);
        for (const [index, radius] of radii.entries()) {
            expect([...links[index].classList]).toEqual([
                'rp-button',
                `rp-button--radius-${radius}`,
            ]);
        }
    });
});
