import { computed, ref } from 'vue';
import { useControllableValue } from '@/composables/useControllableValue';
import { useControlState } from '@/internal/composables/useControlState';
import { useFormControl } from '@/internal/composables/useFormControl';
import { getValuePercent } from '@/utils/number';
import {
    createSliderMarkItems,
    getFormattedSliderValue,
    getSliderAriaValueText,
    normalizeSliderBounds,
    normalizeSliderStep,
    normalizeSliderValue,
} from './sliderModel';
import type { SliderProps, SliderTrackSlotProps } from './types';

export type SliderStateProps = Readonly<
    SliderProps & {
        min: number;
        max: number;
        step: number | 'any';
        tooltip: NonNullable<SliderProps['tooltip']>;
        thumb: NonNullable<SliderProps['thumb']>;
        orientation: NonNullable<SliderProps['orientation']>;
    }
>;

export function useSliderValueState(props: SliderStateProps, onChange: (value: number) => void) {
    const inputRef = ref<HTMLInputElement | null>(null);
    const controllable = useControllableValue<number>({
        modelValue: () => props.modelValue,
        defaultValue: () => props.defaultValue ?? props.min,
        onChange,
    });
    const control = useControlState(props);
    const bounds = computed(() => normalizeSliderBounds(props.min, props.max));
    const nativeMin = computed(() => bounds.value.min);
    const nativeMax = computed(() => bounds.value.max);
    const nativeStep = computed(() => normalizeSliderStep(props.step));
    const normalizedValue = computed(() =>
        normalizeSliderValue(
            controllable.value.value,
            bounds.value.min,
            bounds.value.max,
            nativeStep.value,
        ),
    );
    const valuePercent = computed(() =>
        getValuePercent(normalizedValue.value, bounds.value.min, bounds.value.max),
    );
    const formattedValue = computed(() =>
        getFormattedSliderValue(normalizedValue.value, props.formatValue),
    );
    const ariaValueText = computed(() =>
        getSliderAriaValueText(normalizedValue.value, props.ariaValueText, props.formatValue),
    );
    const markItems = computed(() =>
        createSliderMarkItems(
            props.marks,
            bounds.value.min,
            bounds.value.max,
            (_value, percent) => percent <= valuePercent.value,
            {
                position: '--_rp-slider-mark-position',
                decorativeColors: ['--_rp-slider-mark-color', '--_rp-slider-mark-ring-color'],
                foregroundColors: [
                    '--_rp-slider-mark-label-color',
                    '--_rp-slider-mark-filled-label-color',
                ],
            },
        ),
    );
    const hasMarkLabels = computed(() => markItems.value.some((mark) => mark.hasLabel));
    const trackSlotProps = computed<SliderTrackSlotProps>(() => ({
        value: normalizedValue.value,
        formattedValue: formattedValue.value,
        percent: valuePercent.value,
        min: bounds.value.min,
        max: bounds.value.max,
        orientation: props.orientation,
        getPercent(value) {
            return getValuePercent(value, bounds.value.min, bounds.value.max);
        },
    }));

    function onInput(event: Event) {
        if (control.disabled) return;

        const input = event.target as HTMLInputElement;
        controllable.setValue(
            normalizeSliderValue(
                input.valueAsNumber,
                bounds.value.min,
                bounds.value.max,
                nativeStep.value,
            ),
        );
    }

    useFormControl({
        elements: () => [inputRef.value],
        isControlled: () => controllable.isControlled.value,
        initializeDefault(element) {
            (element as HTMLInputElement).defaultValue = String(
                normalizeSliderValue(
                    controllable.initialValue,
                    nativeMin.value,
                    nativeMax.value,
                    nativeStep.value,
                ),
            );
        },
        validationMessage: () => props.validationMessage,
        readResetValue(elements) {
            controllable.resetValue((elements[0] as HTMLInputElement).valueAsNumber);
        },
        syncControlledValue(elements) {
            (elements[0] as HTMLInputElement).value = String(normalizedValue.value);
        },
    });

    function focus(options?: FocusOptions) {
        inputRef.value?.focus(options);
    }

    return {
        inputRef,
        focus,
        control,
        bounds,
        nativeMin,
        nativeMax,
        nativeStep,
        normalizedValue,
        valuePercent,
        formattedValue,
        ariaValueText,
        markItems,
        hasMarkLabels,
        trackSlotProps,
        onInput,
    };
}
