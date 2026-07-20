<template>
    <div v-bind="rootAttrs">
        <span v-if="$slots.default || $slots.value" class="rp-range-slider__header">
            <span
                v-if="$slots.default"
                :id="labelId"
                v-bind="getPartAttrs('label', { class: 'rp-range-slider__label' })"
            >
                <slot />
            </span>
            <span
                v-if="$slots.value"
                v-bind="getPartAttrs('value', { class: 'rp-range-slider__value' })"
                aria-hidden="true"
            >
                <slot
                    name="value"
                    :value="normalizedValue"
                    :formatted-value="formattedValue"
                    :percent="valuePercent"
                />
            </span>
        </span>

        <span
            v-bind="getPartAttrs('track', { class: 'rp-range-slider__track' })"
            @pointerdown="onTrackPointerDown"
            @mouseenter="onTooltipTrackMouseEnter"
            @mouseleave="onTooltipTrackMouseLeave"
        >
            <span class="rp-range-slider__rail" aria-hidden="true" />
            <span
                v-if="$slots['track-underlay']"
                class="rp-range-slider__track-layer rp-range-slider__track-underlay"
                aria-hidden="true"
            >
                <slot name="track-underlay" v-bind="trackSlotProps" />
            </span>
            <span
                v-bind="getPartAttrs('range', { class: 'rp-range-slider__bar' })"
                aria-hidden="true"
            />
            <span
                v-if="$slots['track-overlay']"
                class="rp-range-slider__track-layer rp-range-slider__track-overlay"
                aria-hidden="true"
            >
                <slot name="track-overlay" v-bind="trackSlotProps" />
            </span>

            <input
                v-for="(thumb, index) in rangeSliderThumbs"
                v-bind="nativeInputAttrs[index]"
                :id="nativeIds[index]"
                :key="thumb"
                :ref="(element) => setInputRef(index, element)"
                :name="nativeNames[index]"
                :form="control.form ?? nativeInputAttrs[index]?.form"
                type="range"
                :value="normalizedValue[index]"
                :min="nativeMin[index]"
                :max="nativeMax[index]"
                :step="nativeStep"
                :orient="orientation === 'vertical' ? 'vertical' : undefined"
                :disabled="control.disabled || undefined"
                :required="props.required ?? nativeInputAttrs[index]?.required"
                :aria-label="ariaLabels[index]"
                :aria-describedby="control.ariaDescribedby"
                :aria-orientation="orientation === 'vertical' ? 'vertical' : undefined"
                :aria-valuetext="ariaValueText[index]"
                :aria-invalid="
                    props.invalid === undefined
                        ? nativeInputAttrs[index]?.['aria-invalid']
                        : control.invalid || undefined
                "
                :aria-required="props.required ?? nativeInputAttrs[index]?.required"
                :data-thumb="thumb"
                :data-disabled="presence(control.disabled)"
                :data-invalid="presence(control.invalid)"
            />

            <span v-if="markItems.length" class="rp-range-slider__marks" aria-hidden="true">
                <span
                    v-for="mark in markItems"
                    :key="mark.key"
                    v-bind="
                        getPartAttrs('mark', {
                            class: [
                                'rp-range-slider__mark',
                                { 'rp-range-slider__mark--filled': mark.filled },
                            ],
                            style: mark.style,
                        })
                    "
                    :data-filled="presence(mark.filled)"
                >
                    <span class="rp-range-slider__mark-dot" />
                    <span
                        v-if="mark.hasLabel"
                        v-bind="
                            getPartAttrs('markLabel', {
                                class: 'rp-range-slider__mark-label',
                            })
                        "
                    >
                        {{ mark.label }}
                    </span>
                </span>
            </span>

            <span class="rp-range-slider__thumbs" aria-hidden="true">
                <span
                    v-for="(thumb, index) in rangeSliderThumbs"
                    :key="thumb"
                    v-bind="
                        getPartAttrs('thumb', {
                            class: ['rp-range-slider__thumb', `rp-range-slider__thumb--${thumb}`],
                        })
                    "
                    :data-range-slider-thumb="thumb"
                    :data-thumb="thumb"
                >
                    <span class="rp-range-slider__thumb-content">
                        <slot
                            name="thumb"
                            :thumb="thumb"
                            :index="index"
                            :value="normalizedValue[index]"
                            :formatted-value="formattedValue[index]"
                            :percent="valuePercent[index]"
                        />
                    </span>
                </span>

                <RangeSliderTooltip
                    v-if="tooltipVisible"
                    :arrow="tooltipArrow"
                    :color="tooltipColor"
                    :auto-contrast="tooltipAutoContrast"
                    :contrast-color="tooltipContrastColor"
                    :content="tooltipContent"
                    :ids="tooltipIds"
                    :merged-content="mergedTooltipContent"
                    :merged-id="mergedTooltipId"
                    :offset="tooltipOffset"
                    :open="tooltipOpen"
                    :orientation="orientation"
                    :placement="tooltipPlacement"
                    :value-percent="valuePercent"
                    :tooltip-class="classNames?.tooltip"
                    :tooltip-style="styles?.tooltip"
                    @update:overlapping="tooltipsOverlapping = $event"
                />
            </span>
        </span>
    </div>
</template>

<script lang="ts" setup vapor>
import { computed, nextTick, ref, useId, type InputHTMLAttributes } from 'vue';
import { useControllableValue } from '@/composables/useControllableValue';
import { useFormControl } from '@/composables/useFormControl';
import { presence, useStylesApi } from '@/styles-api';
import RangeSliderTooltip from './range-slider-tooltip.vue';
import type {
    RangeSliderPart,
    RangeSliderProps,
    RangeSliderTrackSlotProps,
    RangeSliderValue,
} from './types';
import { normalizeRangeSliderValue, useRangeSlider } from './useRangeSlider';

defineOptions({ name: 'RpRangeSlider', inheritAttrs: false });

const slots = defineSlots<{
    default?(): unknown;
    value?(props: Pick<RangeSliderTrackSlotProps, 'value' | 'formattedValue' | 'percent'>): unknown;
    'track-underlay'?(props: RangeSliderTrackSlotProps): unknown;
    'track-overlay'?(props: RangeSliderTrackSlotProps): unknown;
    thumb?(props: {
        thumb: 'lower' | 'upper';
        index: number;
        value: number;
        formattedValue: string | number;
        percent: number;
    }): unknown;
}>();

const props = withDefaults(defineProps<RangeSliderProps>(), {
    modelValue: undefined,
    defaultValue: undefined,
    min: 0,
    max: 100,
    step: 1,
    minRange: 0,
    marks: () => [],
    tooltip: 'hover',
    orientation: 'horizontal',
    ariaLabel: () => ['Minimum', 'Maximum'],
    disabled: undefined,
    required: undefined,
    invalid: undefined,
});

const emit = defineEmits<{
    'update:modelValue': [value: [number, number]];
}>();

const generatedId = useId();
const tooltipsOverlapping = ref(false);
const rangeSliderThumbs = ['lower', 'upper'] as const;
const lowerInputRef = ref<HTMLInputElement | null>(null);
const upperInputRef = ref<HTMLInputElement | null>(null);
const labelId = computed(() => `${props.id ?? generatedId}-label`);
const controllable = useControllableValue<RangeSliderValue>({
    modelValue: () => props.modelValue,
    defaultValue: () => props.defaultValue ?? [props.min, props.max],
    onChange: (value) => emit('update:modelValue', value),
});

const {
    control,
    nativeMin,
    nativeMax,
    nativeStep,
    nativeNames,
    nativeIds,
    rootClass,
    normalizedValue,
    valuePercent,
    formattedValue,
    ariaLabels,
    ariaValueText,
    markItems,
    trackSlotProps,
    trackStyle,
    activeThumb,
    tooltipVisible,
    tooltipOpen,
    tooltipPlacement,
    tooltipIds,
    mergedTooltipId,
    tooltipColor,
    tooltipAutoContrast,
    tooltipContrastColor,
    tooltipOffset,
    tooltipArrow,
    tooltipContent,
    mergedTooltipContent,
    onInput,
    onTrackPointerDown,
    onTooltipFocus,
    onTooltipBlur,
    onTooltipTrackMouseEnter,
    onTooltipTrackMouseLeave,
    onTooltipKeydown,
} = useRangeSlider(
    props,
    (value) => controllable.setValue(value),
    () => controllable.value.value,
);

const validationMessages = computed<[string | undefined, string | undefined]>(() =>
    Array.isArray(props.validationMessage)
        ? props.validationMessage
        : [props.validationMessage, props.validationMessage],
);

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
        const resetValue: RangeSliderValue = [normalizedValue.value[0], normalizedValue.value[1]];

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

const { getPartAttrs, getRootAttrs } = useStylesApi<RangeSliderPart>(props, 'root');
const rootAttrs = computed(() =>
    getRootAttrs({
        class: [
            rootClass.value,
            {
                'rp-range-slider--custom-thumb': Boolean(slots.thumb),
                'rp-range-slider--tooltips-overlapping': tooltipsOverlapping.value,
            },
        ],
        style: trackStyle.value,
        role: 'group',
        'data-active-thumb': activeThumb.value || undefined,
        'data-disabled': presence(control.disabled),
        'data-invalid': presence(control.invalid),
        'data-orientation': props.orientation,
        'aria-labelledby': groupLabelledby.value,
        'aria-describedby': control.ariaDescribedby,
        'aria-invalid': control.invalid || undefined,
        'aria-required': control.required || undefined,
    }),
);

const inputAttrsByThumb = computed<
    [InputHTMLAttributes | undefined, InputHTMLAttributes | undefined]
>(() => {
    if (Array.isArray(props.inputAttrs)) return props.inputAttrs;
    return [props.inputAttrs, props.inputAttrs];
});

const nativeInputAttrs = computed<[InputHTMLAttributes, InputHTMLAttributes]>(
    () =>
        rangeSliderThumbs.map((thumb, index) => {
            const {
                class: compatibilityClass,
                style: compatibilityStyle,
                onInput: compatibilityOnInput,
                onFocus: compatibilityOnFocus,
                onBlur: compatibilityOnBlur,
                onKeydown: compatibilityOnKeydown,
                ...attrs
            } = inputAttrsByThumb.value[index] ?? {};

            return Object.assign({}, attrs, {
                ...getPartAttrs('input', {
                    class: ['rp-range-slider__native', `rp-range-slider__native--${thumb}`],
                    compatibilityClass,
                    compatibilityStyle,
                }),
                onInput(event: InputEvent) {
                    onInput(thumb, event);
                    compatibilityOnInput?.(event);
                },
                onFocus(event: FocusEvent) {
                    onTooltipFocus(thumb);
                    compatibilityOnFocus?.(event);
                },
                onBlur(event: FocusEvent) {
                    onTooltipBlur(thumb);
                    compatibilityOnBlur?.(event);
                },
                onKeydown(event: KeyboardEvent) {
                    onTooltipKeydown(thumb, event);
                    compatibilityOnKeydown?.(event);
                },
            });
        }) as [InputHTMLAttributes, InputHTMLAttributes],
);

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

const groupLabelledby = computed(() => {
    const values = [control.ariaLabelledby, slots.default ? labelId.value : undefined]
        .flatMap((value) => value?.split(/\s+/) ?? [])
        .filter(Boolean);

    return values.length ? Array.from(new Set(values)).join(' ') : undefined;
});

defineExpose({ nativeElements, focus });
</script>

<style src="./range-slider.scss" lang="scss" scoped></style>
