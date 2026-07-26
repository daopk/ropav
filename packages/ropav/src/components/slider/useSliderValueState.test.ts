import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, reactive } from 'vue';
import { mountDomWithApp } from '../../../tests/utils/vue';
import type { SliderOrientation, SliderThumb, SliderTooltip } from './types';
import { useSliderValueState } from './useSliderValueState';

function mountSliderValueState() {
    const props = reactive({
        defaultValue: 27,
        min: 0,
        max: 100,
        step: 5 as number | 'any',
        marks: [
            { value: 20, label: 'Low' },
            { value: 80, label: 'High' },
        ],
        tooltip: 'hover' as SliderTooltip,
        thumb: 'always' as SliderThumb,
        orientation: 'horizontal' as SliderOrientation,
        disabled: false,
        formatValue: (value: number) => `${value}%`,
    });
    const onChange = vi.fn();
    let valueState!: ReturnType<typeof useSliderValueState>;

    const mounted = mountDomWithApp(
        defineComponent({
            setup() {
                valueState = useSliderValueState(props, onChange);
                return () => h('div');
            },
        }),
    );

    return {
        ...mounted,
        props,
        onChange,
        get valueState() {
            return valueState;
        },
    };
}

describe('useSliderValueState', () => {
    it('owns normalized values, native bounds, marks, and input updates', () => {
        const { onChange, props, valueState } = mountSliderValueState();

        expect(valueState.normalizedValue.value).toBe(25);
        expect(valueState.nativeMin.value).toBe(0);
        expect(valueState.nativeMax.value).toBe(100);
        expect(valueState.nativeStep.value).toBe(5);
        expect(valueState.formattedValue.value).toBe('25%');
        expect(valueState.ariaValueText.value).toBe('25%');
        expect(valueState.markItems.value.map(({ filled }) => filled)).toEqual([true, false]);

        const input = document.createElement('input');
        input.type = 'number';
        input.value = '87';
        valueState.onInput({ target: input } as unknown as Event);
        expect(onChange).toHaveBeenCalledWith(85);

        props.disabled = true;
        input.value = '95';
        valueState.onInput({ target: input } as unknown as Event);
        expect(onChange).toHaveBeenCalledOnce();
    });
});
