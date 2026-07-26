import { describe, expect, it } from 'vitest';
import { defineComponent, h, ref } from 'vue';

import { flush, mountDom } from '../../../tests/utils/vue';
import AspectRatio from './aspect-ratio.vue';

describe('AspectRatio', () => {
    it('renders slotted content with a square ratio by default', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(AspectRatio, null, {
                        default: () => h('img', { alt: 'Preview', src: '/preview.png' }),
                    });
                },
            }),
        );

        await flush();

        const root = container.querySelector('.rp-aspect-ratio') as HTMLElement;

        expect(root.tagName).toBe('DIV');
        expect(root.style.getPropertyValue('--_rp-aspect-ratio')).toBe('1');
        expect(root.querySelector('img')?.getAttribute('alt')).toBe('Preview');
    });

    it('applies custom ratios and reacts to prop changes', async () => {
        const ratio = ref(16 / 9);
        const container = mountDom(
            defineComponent({
                render() {
                    return h(AspectRatio, { ratio: ratio.value }, { default: () => 'Content' });
                },
            }),
        );

        await flush();

        const root = container.querySelector('.rp-aspect-ratio') as HTMLElement;

        expect(root.style.getPropertyValue('--_rp-aspect-ratio')).toBe(String(16 / 9));

        ratio.value = 4 / 3;
        await flush();

        expect(root.style.getPropertyValue('--_rp-aspect-ratio')).toBe(String(4 / 3));
    });

    it('falls back to a square for invalid ratios', async () => {
        const invalidRatios = [0, -1, Number.NaN, Number.POSITIVE_INFINITY];
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        'div',
                        invalidRatios.map((ratio) => h(AspectRatio, { ratio })),
                    );
                },
            }),
        );

        await flush();

        const roots = [...container.querySelectorAll('.rp-aspect-ratio')] as HTMLElement[];

        expect(roots).toHaveLength(invalidRatios.length);
        for (const root of roots) {
            expect(root.style.getPropertyValue('--_rp-aspect-ratio')).toBe('1');
        }
    });

    it('forwards native attributes, classes, and styles to the root', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        AspectRatio,
                        {
                            id: 'media-preview',
                            class: 'custom-aspect-ratio',
                            'data-testid': 'aspect-ratio',
                            style: { maxWidth: '320px' },
                        },
                        { default: () => h('div', { class: 'content' }) },
                    );
                },
            }),
        );

        await flush();

        const root = container.querySelector('.rp-aspect-ratio') as HTMLElement;

        expect([...root.classList]).toEqual(['rp-aspect-ratio', 'custom-aspect-ratio']);
        expect(root.id).toBe('media-preview');
        expect(root.dataset.testid).toBe('aspect-ratio');
        expect(root.style.maxWidth).toBe('320px');
        expect(root.querySelector('.content')).toBeTruthy();
    });
});
