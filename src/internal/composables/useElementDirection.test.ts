import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref, type Ref } from 'vue';

import { mountDomWithApp } from '../../../tests/utils/vue';
import type { ElementDirection } from '@/utils/dom/direction';
import { useElementDirection } from './useElementDirection';

function mountDirection(source: Ref<Element | null>) {
    let direction!: Readonly<Ref<ElementDirection>>;
    const mounted = mountDomWithApp(
        defineComponent({
            setup() {
                direction = useElementDirection(source);
                return () => h('div');
            },
        }),
    );
    return { ...mounted, direction };
}

describe('useElementDirection', () => {
    it('reacts to ancestor dir, class, and style changes', async () => {
        const stylesheet = document.createElement('style');
        stylesheet.textContent = '.test-rtl-direction { direction: rtl; }';
        document.head.append(stylesheet);

        const host = document.createElement('div');
        const element = document.createElement('span');
        host.append(element);
        document.body.append(host);
        const { direction } = mountDirection(ref(element));

        expect(direction.value).toBe('ltr');

        host.dir = 'rtl';
        await vi.waitFor(() => expect(direction.value).toBe('rtl'));

        host.removeAttribute('dir');
        await vi.waitFor(() => expect(direction.value).toBe('ltr'));

        host.classList.add('test-rtl-direction');
        await vi.waitFor(() => expect(direction.value).toBe('rtl'));

        host.classList.remove('test-rtl-direction');
        await vi.waitFor(() => expect(direction.value).toBe('ltr'));

        host.style.direction = 'rtl';
        await vi.waitFor(() => expect(direction.value).toBe('rtl'));

        stylesheet.remove();
    });

    it('rebinds when the source or its composed ancestry changes', async () => {
        const ltrHost = document.createElement('div');
        const rtlHost = document.createElement('div');
        const firstElement = document.createElement('span');
        const secondElement = document.createElement('span');
        ltrHost.dir = 'ltr';
        rtlHost.dir = 'rtl';
        ltrHost.append(firstElement);
        rtlHost.append(secondElement);
        document.body.append(ltrHost, rtlHost);

        const source = ref<Element | null>(firstElement);
        const { direction } = mountDirection(source);
        expect(direction.value).toBe('ltr');

        source.value = secondElement;
        await nextTick();
        expect(direction.value).toBe('rtl');

        ltrHost.append(secondElement);
        await vi.waitFor(() => expect(direction.value).toBe('ltr'));

        rtlHost.append(secondElement);
        await vi.waitFor(() => expect(direction.value).toBe('rtl'));
    });

    it('disconnects its observers when its owner unmounts', async () => {
        const host = document.createElement('div');
        const element = document.createElement('span');
        host.append(element);
        document.body.append(host);
        const { direction, unmount } = mountDirection(ref(element));

        unmount();
        host.dir = 'rtl';
        await new Promise<void>((resolve) => setTimeout(resolve, 0));

        expect(direction.value).toBe('ltr');
    });
});
