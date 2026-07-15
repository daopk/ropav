import { describe, expect, it } from 'vitest';
import { defineComponent, h, reactive, ref } from 'vue';

import { flush, keydown, mountDom } from '../../../tests/utils/vue';
import FocusTrap from './focus-trap.vue';
import { useFocusTrap } from './useFocusTrap';
import type { UseFocusTrapReturn } from './types';

const testOptions = {
    delayInitialFocus: false,
    delayReturnFocus: false,
    tabbableOptions: { displayCheck: 'none' as const },
};

function tab(shiftKey = false) {
    document.dispatchEvent(
        new KeyboardEvent('keydown', {
            key: 'Tab',
            bubbles: true,
            cancelable: true,
            shiftKey,
        }),
    );
}

describe('FocusTrap', () => {
    it('cycles focus, supports pause, and syncs active state after Escape', async () => {
        const trigger = document.createElement('button');
        trigger.textContent = 'Open';
        document.body.append(trigger);
        trigger.focus();

        const state = reactive({ active: true, paused: false });
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        FocusTrap,
                        {
                            ...state,
                            options: testOptions,
                            'onUpdate:active': (active: boolean) => {
                                state.active = active;
                            },
                            'onUpdate:paused': (paused: boolean) => {
                                state.paused = paused;
                            },
                        },
                        {
                            default: () => [
                                h('button', { class: 'first' }, 'First'),
                                h('button', { class: 'last' }, 'Last'),
                            ],
                        },
                    );
                },
            }),
        );

        await flush();

        const root = container.querySelector('.rp-focus-trap') as HTMLElement;
        const first = container.querySelector('.first') as HTMLButtonElement;
        const last = container.querySelector('.last') as HTMLButtonElement;

        expect(root.dataset.active).toBe('');
        expect(document.activeElement).toBe(first);

        last.focus();
        tab();
        expect(document.activeElement).toBe(first);

        state.paused = true;
        await flush();
        expect(root.dataset.paused).toBe('');

        state.paused = false;
        await flush();
        expect(root.dataset.paused).toBeUndefined();

        keydown(document, 'Escape');
        await flush();

        expect(state.active).toBe(false);
        expect(root.dataset.active).toBeUndefined();
        expect(document.activeElement).toBe(trigger);
    });

    it('activates a composable trap when its target becomes available', async () => {
        let controls: UseFocusTrapReturn | undefined;

        const container = mountDom(
            defineComponent({
                setup() {
                    const target = ref<HTMLElement | null>(null);
                    controls = useFocusTrap(target, { ...testOptions, immediate: true });
                    return () =>
                        h('div', { ref: target }, [h('button', { class: 'only' }, 'Only action')]);
                },
            }),
        );

        await flush();

        expect(controls?.focusTrap.value).toBeTruthy();
        expect(controls?.isActive.value).toBe(true);
        expect(document.activeElement).toBe(container.querySelector('.only'));

        controls?.pause();
        expect(controls?.isPaused.value).toBe(true);

        controls?.unpause();
        expect(controls?.isPaused.value).toBe(false);

        controls?.deactivate({ returnFocus: false });
        expect(controls?.isActive.value).toBe(false);
    });
});
