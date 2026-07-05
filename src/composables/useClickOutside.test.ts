import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';

import { click, mountDomWithApp } from '../../tests/utils/vue';
import { useClickOutside } from './useClickOutside';

function mountClickOutside(initialActive: boolean) {
    const target = ref<HTMLElement | null>(null);
    const active = ref(initialActive);
    const callback = vi.fn();
    const wrapper = mountDomWithApp(defineComponent({
        setup() {
            useClickOutside(target, active, callback);
            return () => h('div', { ref: target, id: 'target' }, [
                h('button', { id: 'inside', type: 'button' }, 'Inside'),
            ]);
        },
    }));

    return { ...wrapper, active, callback };
}

describe('useClickOutside', () => {
    it('calls the callback for outside clicks but ignores clicks inside the target', async () => {
        const { container, callback } = mountClickOutside(true);
        await nextTick();

        click(container.querySelector('#inside')!);
        expect(callback).not.toHaveBeenCalled();

        click(document.body);
        expect(callback).toHaveBeenCalledTimes(1);
    });

    it('adds and removes the listener as active changes', async () => {
        const { active, callback } = mountClickOutside(false);
        await nextTick();

        click(document.body);
        expect(callback).not.toHaveBeenCalled();

        active.value = true;
        await nextTick();
        click(document.body);
        expect(callback).toHaveBeenCalledTimes(1);

        active.value = false;
        await nextTick();
        click(document.body);
        expect(callback).toHaveBeenCalledTimes(1);
    });

    it('removes the listener on unmount', async () => {
        const { callback, unmount } = mountClickOutside(true);
        await nextTick();

        unmount();
        click(document.body);

        expect(callback).not.toHaveBeenCalled();
    });
});
