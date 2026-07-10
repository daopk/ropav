import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, ref } from 'vue';

import { flush, mountDom } from '../../../tests/utils/vue';
import Avatar from './avatar.vue';
import { avatarColors, avatarRadiuses, avatarSizes, avatarVariants } from './types';

describe('Avatar', () => {
    it('renders an image with an accessible name', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(Avatar, {
                        src: '/person.jpg',
                        alt: 'Ada Lovelace',
                    });
                },
            }),
        );

        await flush();

        const avatar = container.querySelector('.rp-avatar') as HTMLElement;
        const image = container.querySelector('.rp-avatar__image') as HTMLImageElement;

        expect([...avatar.classList]).toEqual(['rp-avatar']);
        expect(avatar.getAttribute('role')).toBeNull();
        expect(avatar.getAttribute('aria-label')).toBeNull();
        expect(image.getAttribute('src')).toBe('/person.jpg');
        expect(image.getAttribute('alt')).toBe('Ada Lovelace');
        expect(container.querySelector('.rp-avatar__fallback')).toBeNull();
    });

    it('uses the explicit aria label as the image name', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(Avatar, {
                        src: '/person.jpg',
                        alt: 'Ada Lovelace',
                        ariaLabel: 'Profile picture',
                    });
                },
            }),
        );

        await flush();

        const image = container.querySelector('.rp-avatar__image') as HTMLImageElement;

        expect(image.getAttribute('alt')).toBe('Profile picture');
    });

    it('renders initials from the first and last name', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(Avatar, { name: 'Ada Byron Lovelace' });
                },
            }),
        );

        await flush();

        const avatar = container.querySelector('.rp-avatar') as HTMLElement;
        const fallback = container.querySelector('.rp-avatar__fallback') as HTMLElement;

        expect(avatar.getAttribute('role')).toBe('img');
        expect(avatar.getAttribute('aria-label')).toBe('Ada Byron Lovelace');
        expect(fallback.getAttribute('aria-hidden')).toBe('true');
        expect(container.querySelector('.rp-avatar__initials')?.textContent).toBe('AL');
    });

    it('uses up to two characters for a single name', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(Avatar, { name: 'zoë' });
                },
            }),
        );

        await flush();

        expect(container.querySelector('.rp-avatar__initials')?.textContent).toBe('ZO');
    });

    it('renders a default icon when no image or name is provided', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(Avatar);
                },
            }),
        );

        await flush();

        expect(container.querySelector('.rp-avatar__icon')).toBeTruthy();
        expect(container.querySelector('.rp-avatar')?.getAttribute('role')).toBeNull();
    });

    it('lets the default slot replace generated fallback content', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(Avatar, null, {
                        default: () => h('span', { class: 'custom-fallback' }, 'Team'),
                    });
                },
            }),
        );

        await flush();

        expect(container.querySelector('.rp-avatar__fallback .custom-fallback')?.textContent).toBe(
            'Team',
        );
        expect(container.querySelector('.rp-avatar__icon')).toBeNull();
        expect(container.querySelector('.rp-avatar__initials')).toBeNull();
    });

    it('falls back and emits error when the image fails', async () => {
        const onError = vi.fn();
        const container = mountDom(
            defineComponent({
                render() {
                    return h(Avatar, {
                        src: '/missing.jpg',
                        name: 'Grace Hopper',
                        onError,
                    });
                },
            }),
        );

        await flush();

        const image = container.querySelector('.rp-avatar__image') as HTMLImageElement;
        const error = new Event('error');
        image.dispatchEvent(error);
        await flush();

        expect(onError).toHaveBeenCalledOnce();
        expect(onError).toHaveBeenCalledWith(error);
        expect(container.querySelector('.rp-avatar__image')).toBeNull();
        expect(container.querySelector('.rp-avatar__initials')?.textContent).toBe('GH');
    });

    it('tries the image again when src changes', async () => {
        const source = ref('/first.jpg');
        const container = mountDom(
            defineComponent({
                setup() {
                    return () => h(Avatar, { src: source.value, alt: 'Profile' });
                },
            }),
        );

        await flush();

        container.querySelector('.rp-avatar__image')?.dispatchEvent(new Event('error'));
        await flush();
        expect(container.querySelector('.rp-avatar__image')).toBeNull();

        source.value = '/second.jpg';
        await flush();

        expect(container.querySelector('.rp-avatar__image')?.getAttribute('src')).toBe(
            '/second.jpg',
        );
    });

    it('emits load from the image', async () => {
        const onLoad = vi.fn();
        const container = mountDom(
            defineComponent({
                render() {
                    return h(Avatar, { src: '/person.jpg', onLoad });
                },
            }),
        );

        await flush();

        const load = new Event('load');
        container.querySelector('.rp-avatar__image')?.dispatchEvent(load);

        expect(onLoad).toHaveBeenCalledOnce();
        expect(onLoad).toHaveBeenCalledWith(load);
    });

    it('adds size and radius modifiers', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h('div', [
                        ...avatarSizes.map((size) => h(Avatar, { size })),
                        ...avatarRadiuses.map((radius) => h(Avatar, { radius })),
                    ]);
                },
            }),
        );

        await flush();

        const avatars = [...container.querySelectorAll('.rp-avatar')];

        expect(avatars).toHaveLength(avatarSizes.length + avatarRadiuses.length);
        for (const [index, size] of avatarSizes.entries()) {
            expect([...avatars[index].classList]).toEqual(['rp-avatar', `rp-avatar--size-${size}`]);
        }
        for (const [index, radius] of avatarRadiuses.entries()) {
            expect([...avatars[index + avatarSizes.length].classList]).toEqual([
                'rp-avatar',
                `rp-avatar--radius-${radius}`,
            ]);
        }
    });

    it('applies the color roles for each variant', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        'div',
                        avatarVariants.map((variant) =>
                            h(Avatar, { color: 'blue', name: variant, variant }),
                        ),
                    );
                },
            }),
        );

        await flush();

        const avatars = [...container.querySelectorAll('.rp-avatar')] as HTMLElement[];
        const expectedRoles = [
            {
                background: 'var(--rp-color-blue-filled)',
                foreground: 'var(--rp-color-white)',
                border: 'var(--rp-color-blue-filled)',
            },
            {
                background: 'var(--rp-color-blue-light)',
                foreground: 'var(--rp-color-blue-light-color)',
                border: 'transparent',
            },
            {
                background: 'var(--rp-color-blue-light)',
                foreground: 'var(--rp-color-blue-light-color)',
                border: 'var(--rp-color-blue-outline)',
            },
            {
                background: 'transparent',
                foreground: 'var(--rp-color-blue-light-color)',
                border: 'var(--rp-color-blue-outline)',
            },
        ];

        expect(avatars).toHaveLength(avatarVariants.length);
        for (const [index, variant] of avatarVariants.entries()) {
            const avatar = avatars[index];
            const expected = expectedRoles[index];

            expect([...avatar.classList]).toEqual(['rp-avatar', `rp-avatar--${variant}`]);
            expect(avatar.style.getPropertyValue('--_rp-avatar-bg')).toBe(expected.background);
            expect(avatar.style.getPropertyValue('--_rp-avatar-fg')).toBe(expected.foreground);
            expect(avatar.style.getPropertyValue('--_rp-avatar-border')).toBe(expected.border);
        }
    });

    it('resolves supported colors to avatar variables', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        'div',
                        avatarColors.map((color) => h(Avatar, { color, name: color })),
                    );
                },
            }),
        );

        await flush();

        const avatars = [...container.querySelectorAll('.rp-avatar')] as HTMLElement[];

        expect(avatars).toHaveLength(avatarColors.length);
        for (const [index, color] of avatarColors.entries()) {
            expect(avatars[index].style.getPropertyValue('--_rp-avatar-bg')).toBe(
                `var(--rp-color-${color}-filled)`,
            );
            expect(avatars[index].style.getPropertyValue('--_rp-avatar-fg')).toBe(
                'var(--rp-color-white)',
            );
            expect(avatars[index].style.getPropertyValue('--_rp-avatar-border')).toBe(
                `var(--rp-color-${color}-filled)`,
            );
        }
    });

    it('supports custom colors with automatic contrast', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(Avatar, {
                        color: '#fab005',
                        autoContrast: true,
                        name: 'Contrast',
                    });
                },
            }),
        );

        await flush();

        const avatar = container.querySelector('.rp-avatar') as HTMLElement;

        expect(avatar.style.getPropertyValue('--_rp-avatar-bg')).toBe('#fab005');
        expect(avatar.style.getPropertyValue('--_rp-avatar-fg')).toBe('var(--rp-color-black)');
    });

    it('can be hidden from assistive technologies', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(Avatar as any, {
                        'aria-hidden': 'true',
                        src: '/person.jpg',
                        alt: 'Ada Lovelace',
                    });
                },
            }),
        );

        await flush();

        const avatar = container.querySelector('.rp-avatar') as HTMLElement;
        const image = container.querySelector('.rp-avatar__image') as HTMLImageElement;

        expect(avatar.getAttribute('aria-hidden')).toBe('true');
        expect(avatar.getAttribute('role')).toBeNull();
        expect(avatar.getAttribute('aria-label')).toBeNull();
        expect(image.getAttribute('alt')).toBe('');
    });
});
