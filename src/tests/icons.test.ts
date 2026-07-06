import { describe, expect, it } from 'vitest';
import { defineComponent, h } from 'vue';
import CheckIcon from '~icons/lucide/check';

import { flush, mountDom } from '../../tests/utils/vue';

describe('icons', () => {
    it('compiles virtual icons as Vue Vapor components', async () => {
        expect(Reflect.get(CheckIcon, '__vapor')).toBe(true);

        const container = mountDom(
            defineComponent({
                render() {
                    return h(CheckIcon, {
                        class: 'test-icon',
                        'aria-hidden': 'true',
                    });
                },
            }),
        );

        await flush();

        const svg = container.querySelector('svg');

        expect(svg).toBeTruthy();
        expect(svg?.classList.contains('test-icon')).toBe(true);
        expect(svg?.getAttribute('aria-hidden')).toBe('true');
    });
});
