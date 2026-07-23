import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, reactive } from 'vue';
import { mountDomWithApp } from '../../../tests/utils/vue';
import type {
    RangeSliderThumbOptions,
    RangeSliderTooltip,
    RangeSliderValue,
    SliderOrientation,
} from './types';
import { useRangeSliderValueState } from './useRangeSliderValueState';

function mountRangeValueState(minRange = 20) {
    const props = reactive({
        id: 'budget',
        name: ['minimum', 'maximum'] as [string, string],
        defaultValue: [20, 80] as RangeSliderValue,
        min: 0,
        max: 100,
        step: 10 as number | 'any',
        minRange,
        marks: [10, { value: 50, label: 'Target' }, 90],
        tooltip: 'hover' as RangeSliderTooltip,
        thumb: {} as RangeSliderThumbOptions,
        orientation: 'horizontal' as SliderOrientation,
        ariaLabel: ['Minimum', 'Maximum'] as [string, string],
        disabled: false,
    });
    const onChange = vi.fn();
    const setActiveThumb = vi.fn();
    let valueState!: ReturnType<typeof useRangeSliderValueState>;

    const mounted = mountDomWithApp(
        defineComponent({
            setup() {
                valueState = useRangeSliderValueState(props, onChange, setActiveThumb);
                return () => h('div');
            },
        }),
    );

    return {
        ...mounted,
        props,
        onChange,
        setActiveThumb,
        get valueState() {
            return valueState;
        },
    };
}

describe('useRangeSliderValueState', () => {
    it('derives endpoint native attrs and marks from the normalized range', () => {
        const { valueState } = mountRangeValueState();

        expect(valueState.normalizedValue.value).toEqual([20, 80]);
        expect(valueState.nativeMin.value).toEqual([0, 40]);
        expect(valueState.nativeMax.value).toEqual([60, 100]);
        expect(valueState.nativeNames.value).toEqual(['minimum', 'maximum']);
        expect(valueState.nativeIds.value).toEqual(['budget', 'budget-upper']);
        expect(valueState.markItems.value.map(({ filled }) => filled)).toEqual([
            false,
            true,
            false,
        ]);
    });

    it('commits constrained values and reports thumb crossing through its callback seam', () => {
        const constrained = mountRangeValueState();
        expect(constrained.valueState.updateThumb('lower', 90)).toBe('lower');
        expect(constrained.setActiveThumb).toHaveBeenCalledWith('lower');
        expect(constrained.onChange).toHaveBeenCalledWith([60, 80]);

        const crossing = mountRangeValueState(0);
        expect(crossing.valueState.updateThumb('lower', 90)).toBe('upper');
        expect(crossing.setActiveThumb).toHaveBeenCalledWith('upper');
        expect(crossing.onChange).toHaveBeenCalledWith([80, 90]);

        crossing.props.disabled = true;
        crossing.valueState.updateThumb('upper', 100);
        expect(crossing.onChange).toHaveBeenCalledOnce();
    });
});
