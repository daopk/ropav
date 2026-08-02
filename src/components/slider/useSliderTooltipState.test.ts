import { describe, expect, it } from 'vitest';
import { computed, defineComponent, h, reactive } from 'vue';
import { mountDomWithApp } from '../../../tests/utils/vue';
import type { SliderOrientation, SliderTooltip } from './types';
import { useSliderTooltipState } from './useSliderTooltipState';

describe('useSliderTooltipState', () => {
    it('orchestrates focus visibility, Escape dismissal, and disabled state', () => {
        const state = reactive({
            tooltip: 'hover' as SliderTooltip,
            orientation: 'horizontal' as SliderOrientation,
            disabled: false,
            value: 30,
        });
        let tooltip!: ReturnType<typeof useSliderTooltipState>;
        mountDomWithApp(
            defineComponent({
                setup() {
                    tooltip = useSliderTooltipState({
                        tooltip: () => state.tooltip,
                        orientation: () => state.orientation,
                        disabled: () => state.disabled,
                        value: computed(() => state.value),
                        bounds: computed(() => ({ min: 0, max: 100 })),
                        step: computed(() => 1),
                        formatValue: () => undefined,
                    });
                    return () => h('div');
                },
            }),
        );

        tooltip.onTooltipFocusIn();
        expect(tooltip.tooltipOpen.value).toBe(true);

        tooltip.onTooltipKeydown(new KeyboardEvent('keydown', { key: 'Escape' }));
        expect(tooltip.tooltipOpen.value).toBe(false);

        tooltip.onTooltipFocusIn();
        expect(tooltip.tooltipOpen.value).toBe(true);

        state.disabled = true;
        expect(tooltip.tooltipOpen.value).toBe(false);
    });
});
