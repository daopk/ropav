import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, reactive } from 'vue';

import { mountDomWithApp } from '../../../tests/utils/vue';
import type { TooltipProps } from './types';
import { useTooltip } from './useTooltip';

function mountTooltip(overrides: TooltipProps = {}) {
    const props = reactive<TooltipProps>({ delay: 100, ...overrides });
    let tooltip!: ReturnType<typeof useTooltip>;
    const wrapper = mountDomWithApp(
        defineComponent({
            setup() {
                tooltip = useTooltip(props);
                return () => h('div');
            },
        }),
    );

    return { ...wrapper, props, tooltip };
}

describe('useTooltip', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('shows only after the configured delay', () => {
        const { tooltip } = mountTooltip();

        tooltip.onShow();
        vi.advanceTimersByTime(99);
        expect(tooltip.isVisible.value).toBe(false);

        vi.advanceTimersByTime(1);
        expect(tooltip.isVisible.value).toBe(true);
    });

    it('cancels pending show timers and hides visible tips', () => {
        const { tooltip } = mountTooltip();

        tooltip.onShow();
        tooltip.onHide();
        vi.advanceTimersByTime(100);
        expect(tooltip.isVisible.value).toBe(false);

        tooltip.onShow();
        vi.advanceTimersByTime(100);
        expect(tooltip.isVisible.value).toBe(true);

        tooltip.onHide();
        expect(tooltip.isVisible.value).toBe(false);
    });

    it('does not show when disabled', () => {
        const { tooltip } = mountTooltip({ disabled: true });

        tooltip.onShow();
        vi.advanceTimersByTime(100);

        expect(tooltip.isVisible.value).toBe(false);
    });

    it('clears pending timers on unmount', () => {
        const { tooltip, unmount } = mountTooltip();

        tooltip.onShow();
        unmount();
        vi.advanceTimersByTime(100);

        expect(tooltip.isVisible.value).toBe(false);
    });
});
