import { computed, nextTick, ref } from 'vue';
import { useControllableValue } from '@/composables/useControllableValue';
import { useControlState } from '@/internal/composables/useControlState';
import { useFormControl } from '@/internal/composables/useFormControl';
import { getValuePercent } from '@/utils/number';
import {
    getFormattedRangeSliderValue,
    getRangeSliderAriaValueText,
    getRangeSliderNativeLimits,
    getRangeSliderNativeStep,
    getRangeSliderThumbUpdate,
    normalizeRangeSliderMinRange,
    normalizeRangeSliderValue,
} from './rangeSliderModel';
import { createSliderMarkItems, normalizeSliderBounds, normalizeSliderStep } from './sliderModel';
import type {
    RangeSliderProps,
    RangeSliderThumb,
    RangeSliderTrackSlotProps,
    RangeSliderValue,
} from './types';

export type RangeSliderStateProps = Readonly<
    RangeSliderProps & {
        min: number;
        max: number;
        step: number | 'any';
        minRange: number;
        tooltip: NonNullable<RangeSliderProps['tooltip']>;
        orientation: NonNullable<RangeSliderProps['orientation']>;
        ariaLabel: [string, string];
    }
>;

export function useRangeSliderValueState(
    props: RangeSliderStateProps,
    onChange: (value: RangeSliderValue) => void,
    setActiveThumb: (thumb: RangeSliderThumb) => void,
) {
    const lowerInputRef = ref<HTMLInputElement | null>(null);
    const upperInputRef = ref<HTMLInputElement | null>(null);
    const controllable = useControllableValue<RangeSliderValue>({
        modelValue: () => props.modelValue,
        defaultValue: () => props.defaultValue ?? [props.min, props.max],
        onChange,
    });
    const control = useControlState(props);
    const bounds = computed(() => normalizeSliderBounds(props.min, props.max));
    const valueStep = computed(() => normalizeSliderStep(props.step));
    const nativeStep = computed(() => getRangeSliderNativeStep(bounds.value, valueStep.value));
    const hasManualNativeKeyboard = computed(
        () => valueStep.value !== 'any' && nativeStep.value === 'any',
    );
    const normalizedMinRange = computed(() =>
        normalizeRangeSliderMinRange(props.minRange, bounds.value.min, bounds.value.max),
    );
    const normalizedValue = computed(() =>
        normalizeRangeSliderValue(
            controllable.value.value,
            bounds.value.min,
            bounds.value.max,
            valueStep.value,
            normalizedMinRange.value,
        ),
    );
    const nativeLimits = computed(() =>
        getRangeSliderNativeLimits(
            normalizedValue.value,
            bounds.value,
            valueStep.value,
            normalizedMinRange.value,
        ),
    );
    const nativeMin = computed(() => nativeLimits.value.min);
    const nativeMax = computed(() => nativeLimits.value.max);
    const valuePercent = computed<RangeSliderValue>(() => [
        getValuePercent(normalizedValue.value[0], bounds.value.min, bounds.value.max),
        getValuePercent(normalizedValue.value[1], bounds.value.min, bounds.value.max),
    ]);
    const formattedValue = computed(() =>
        getFormattedRangeSliderValue(normalizedValue.value, props.formatValue),
    );
    const ariaLabels = computed<[string, string]>(() => props.ariaLabel ?? ['Minimum', 'Maximum']);
    const ariaValueText = computed(() =>
        getRangeSliderAriaValueText(normalizedValue.value, props.ariaValueText, props.formatValue),
    );
    const nativeNames = computed<[string | undefined, string | undefined]>(() =>
        Array.isArray(props.name) ? props.name : [props.name, props.name],
    );
    const nativeIds = computed<[string | undefined, string | undefined]>(() => [
        control.id,
        control.id ? `${control.id}-upper` : undefined,
    ]);
    const validationMessages = computed<[string | undefined, string | undefined]>(() =>
        Array.isArray(props.validationMessage)
            ? props.validationMessage
            : [props.validationMessage, props.validationMessage],
    );
    const markItems = computed(() =>
        createSliderMarkItems(
            props.marks,
            bounds.value.min,
            bounds.value.max,
            (value) => value >= normalizedValue.value[0] && value <= normalizedValue.value[1],
            {
                position: '--_rp-range-slider-mark-position',
                decorativeColors: [
                    '--_rp-range-slider-mark-color',
                    '--_rp-range-slider-mark-ring-color',
                ],
                foregroundColors: [
                    '--_rp-range-slider-mark-label-color',
                    '--_rp-range-slider-mark-filled-label-color',
                ],
            },
        ),
    );
    const hasMarkLabels = computed(() => markItems.value.some((mark) => mark.hasLabel));
    const trackSlotProps = computed<RangeSliderTrackSlotProps>(() => ({
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

    function normalizeInitialValue(value: RangeSliderValue = controllable.initialValue) {
        return normalizeRangeSliderValue(value, props.min, props.max, props.step, props.minRange);
    }

    useFormControl({
        elements: () => [lowerInputRef.value, upperInputRef.value],
        isControlled: () => controllable.isControlled.value,
        initializeDefault(element, index) {
            const initialValue = normalizeInitialValue();
            (element as HTMLInputElement).defaultValue = String(initialValue[index]);
        },
        validationMessage: (_element, index) => validationMessages.value[index],
        readResetValue(elements) {
            const resetValue: RangeSliderValue = [
                normalizedValue.value[0],
                normalizedValue.value[1],
            ];

            for (const element of elements) {
                const index = element === upperInputRef.value ? 1 : 0;
                resetValue[index] = Number((element as HTMLInputElement).defaultValue);
            }

            const nextValue = normalizeInitialValue(resetValue);
            controllable.resetValue(nextValue);
            void nextTick(() => {
                if (lowerInputRef.value) lowerInputRef.value.value = String(nextValue[0]);
                if (upperInputRef.value) upperInputRef.value.value = String(nextValue[1]);
            });
        },
        syncControlledValue(elements) {
            for (const element of elements) {
                const index = element === upperInputRef.value ? 1 : 0;
                (element as HTMLInputElement).value = String(normalizedValue.value[index]);
            }
        },
    });

    function updateThumb(thumb: RangeSliderThumb, value: number, anchorValue?: number) {
        if (control.disabled) return thumb;

        const update = getRangeSliderThumbUpdate({
            thumb,
            value,
            currentValue: normalizedValue.value,
            bounds: bounds.value,
            step: valueStep.value,
            minRange: normalizedMinRange.value,
            nativeMin: nativeMin.value,
            nativeMax: nativeMax.value,
            anchorValue,
        });
        setActiveThumb(update.thumb);
        controllable.setValue(update.value);
        return update.thumb;
    }

    const nativeElements = computed<[HTMLInputElement | null, HTMLInputElement | null]>(() => [
        lowerInputRef.value,
        upperInputRef.value,
    ]);

    function setInputRef(index: number, element: unknown) {
        const input = element instanceof HTMLInputElement ? element : null;
        if (index === 0) lowerInputRef.value = input;
        else upperInputRef.value = input;
    }

    function focus(options?: FocusOptions) {
        lowerInputRef.value?.focus(options);
    }

    return {
        nativeElements,
        setInputRef,
        focus,
        control,
        bounds,
        valueStep,
        hasManualNativeKeyboard,
        nativeMin,
        nativeMax,
        nativeStep,
        nativeNames,
        nativeIds,
        normalizedValue,
        valuePercent,
        formattedValue,
        ariaLabels,
        ariaValueText,
        markItems,
        hasMarkLabels,
        trackSlotProps,
        updateThumb,
    };
}
