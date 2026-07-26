import { describe, expect, it } from 'vitest';
import { defineComponent, h } from 'vue';

import { flush, mountDom } from '../../../tests/utils/vue';
import Overlay from './overlay.vue';

describe('Overlay', () => {
    it('renders an absolute overlay with custom color, opacity, and z-index', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        'div',
                        { style: { position: 'relative' } },
                        h(Overlay, {
                            color: '#123456',
                            opacity: 0.4,
                            zIndex: 7,
                        }),
                    );
                },
            }),
        );

        await flush();

        const overlay = container.querySelector('.rp-overlay') as HTMLElement;

        expect([...overlay.classList]).toEqual(['rp-overlay']);
        expect(overlay.getAttribute('aria-hidden')).toBe('true');
        expect(overlay.style.getPropertyValue('--_rp-overlay-color')).toBe('#123456');
        expect(overlay.style.getPropertyValue('--_rp-overlay-opacity')).toBe('0.4');
        expect(overlay.style.getPropertyValue('--_rp-overlay-z-index')).toBe('7');
    });

    it('clamps opacity to the valid CSS opacity range', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h('div', [
                        h(Overlay, { opacity: -1 }),
                        h(Overlay, { opacity: 2 }),
                        h(Overlay, { opacity: Number.NaN }),
                    ]);
                },
            }),
        );

        await flush();

        const overlays = [...container.querySelectorAll('.rp-overlay')] as HTMLElement[];

        expect(overlays[0].style.getPropertyValue('--_rp-overlay-opacity')).toBe('0');
        expect(overlays[1].style.getPropertyValue('--_rp-overlay-opacity')).toBe('1');
        expect(overlays[2].style.getPropertyValue('--_rp-overlay-opacity')).toBe('1');
    });

    it('uses background-image and ignores color and opacity when gradient is set', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(Overlay, {
                        color: '#123456',
                        opacity: 0.25,
                        gradient: 'linear-gradient(90deg, #000, #fff)',
                    });
                },
            }),
        );

        await flush();

        const overlay = container.querySelector('.rp-overlay') as HTMLElement;

        expect([...overlay.classList]).toEqual(['rp-overlay', 'rp-overlay--gradient']);
        expect(overlay.style.backgroundImage).toContain('linear-gradient');
        expect(overlay.style.getPropertyValue('--_rp-overlay-color')).toBe('');
        expect(overlay.style.getPropertyValue('--_rp-overlay-opacity')).toBe('');
    });

    it('adds backdrop blur styles when blur is set', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h('div', [
                        h(Overlay, { blur: 8 }),
                        h(Overlay, { blur: '0.75rem', gradient: 'linear-gradient(#000, #fff)' }),
                    ]);
                },
            }),
        );

        await flush();

        const overlays = [...container.querySelectorAll('.rp-overlay')] as HTMLElement[];

        expect([...overlays[0].classList]).toEqual(['rp-overlay', 'rp-overlay--blurred']);
        expect(overlays[0].style.getPropertyValue('--_rp-overlay-blur')).toBe('8px');
        expect([...overlays[1].classList]).toEqual([
            'rp-overlay',
            'rp-overlay--gradient',
            'rp-overlay--blurred',
        ]);
        expect(overlays[1].style.getPropertyValue('--_rp-overlay-blur')).toBe('0.75rem');
    });

    it('does not add backdrop blur styles for invalid numeric blur values', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h('div', [
                        h(Overlay, { blur: -1 }),
                        h(Overlay, { blur: Number.NaN }),
                        h(Overlay, { blur: '' }),
                    ]);
                },
            }),
        );

        await flush();

        const overlays = [...container.querySelectorAll('.rp-overlay')] as HTMLElement[];

        for (const overlay of overlays) {
            expect([...overlay.classList]).toEqual(['rp-overlay']);
            expect(overlay.style.getPropertyValue('--_rp-overlay-blur')).toBe('');
        }
    });

    it('supports interactive overlays and disabled rendering', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h('div', [
                        h(Overlay, { interactive: true }),
                        h(Overlay, { disabled: true }),
                    ]);
                },
            }),
        );

        await flush();

        const overlays = container.querySelectorAll('.rp-overlay');

        expect(overlays).toHaveLength(1);
        expect([...overlays[0].classList]).toEqual(['rp-overlay', 'rp-overlay--interactive']);
    });
});
