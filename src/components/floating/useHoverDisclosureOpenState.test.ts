import { defineComponent, h, nextTick, shallowRef } from 'vue';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { mountDomWithApp } from '../../../tests/utils/vue';
import { createHoverDisclosureInteractionModel } from './hoverDisclosureInteractionModel';
import type { UseHoverDisclosureOptions } from './types';
import { useHoverDisclosureOpenState } from './useHoverDisclosureOpenState';

function mountOpenState(options: Readonly<UseHoverDisclosureOptions>, onContentClosed = vi.fn()) {
    const interaction = createHoverDisclosureInteractionModel();
    let state!: ReturnType<typeof useHoverDisclosureOpenState>;
    const mounted = mountDomWithApp(
        defineComponent({
            setup() {
                state = useHoverDisclosureOpenState({
                    interaction,
                    onContentClosed,
                    options,
                });
                return () => h('div');
            },
        }),
    );

    return {
        ...mounted,
        interaction,
        onContentClosed,
        get state() {
            return state;
        },
    };
}

afterEach(() => {
    vi.useRealTimers();
});

describe('hover disclosure open state', () => {
    it('gates delayed open and close requests on current interactions', () => {
        vi.useFakeTimers();
        const changes = vi.fn();
        const { interaction, state } = mountOpenState({
            closeDelay: 80,
            onOpenChange: changes,
            openDelay: 100,
        });

        interaction.send({
            type: 'hover',
            part: 'trigger',
            active: true,
        });
        state.request({
            open: true,
            reason: 'hover',
            timing: 'delayed',
        });
        vi.advanceTimersByTime(99);
        expect(state.isOpen.value).toBe(false);

        vi.advanceTimersByTime(1);
        expect(state.isOpen.value).toBe(true);
        expect(changes).toHaveBeenLastCalledWith(
            true,
            expect.objectContaining({ reason: 'hover' }),
        );

        interaction.send({
            type: 'hover',
            part: 'trigger',
            active: false,
        });
        state.request({
            open: false,
            reason: 'hover',
            timing: 'delayed',
        });
        vi.advanceTimersByTime(79);
        expect(state.isOpen.value).toBe(true);

        interaction.send({
            type: 'focus',
            part: 'content',
            active: true,
        });
        vi.advanceTimersByTime(1);
        expect(state.isOpen.value).toBe(true);
    });

    it('deduplicates controlled requests until the owner accepts a value', async () => {
        const controlledOpen = shallowRef(false);
        const changes = vi.fn();
        const { state } = mountOpenState({
            open: controlledOpen,
            onOpenChange: changes,
        });

        state.request({
            open: true,
            reason: 'programmatic',
            timing: 'immediate',
        });
        state.request({
            open: true,
            reason: 'focus',
            timing: 'immediate',
        });
        expect(changes).toHaveBeenCalledTimes(1);
        expect(state.isOpen.value).toBe(false);

        controlledOpen.value = true;
        await nextTick();
        expect(state.isOpen.value).toBe(true);

        state.request({
            open: false,
            reason: 'escape',
            timing: 'immediate',
        });
        expect(changes).toHaveBeenLastCalledWith(
            false,
            expect.objectContaining({ reason: 'escape' }),
        );
    });

    it('cancels pending work when disabled or disposed', async () => {
        vi.useFakeTimers();
        const disabled = shallowRef(false);
        const changes = vi.fn();
        const mounted = mountOpenState({
            disabled,
            onOpenChange: changes,
            openDelay: 100,
        });

        mounted.interaction.send({
            type: 'hover',
            part: 'trigger',
            active: true,
        });
        mounted.state.request({
            open: true,
            reason: 'hover',
            timing: 'delayed',
        });
        disabled.value = true;
        await nextTick();
        vi.advanceTimersByTime(100);
        expect(changes).not.toHaveBeenCalledWith(true, expect.anything());

        disabled.value = false;
        await nextTick();
        mounted.interaction.send({
            type: 'hover',
            part: 'trigger',
            active: true,
        });
        mounted.state.request({
            open: true,
            reason: 'hover',
            timing: 'delayed',
        });
        mounted.unmount();
        vi.advanceTimersByTime(100);
        expect(changes).not.toHaveBeenCalledWith(true, expect.anything());
    });
});
