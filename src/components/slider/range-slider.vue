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
                :data-disabled="toPresenceAttribute(control.disabled)"
                :data-invalid="toPresenceAttribute(control.invalid)"
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
                    :data-filled="toPresenceAttribute(mark.filled)"
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
import { computed, ref, useId, type InputHTMLAttributes } from 'vue';
import { useStylesApi } from '@/styles-api';
import { toPresenceAttribute } from '@/utils/attributes';
import { mergeAriaIdRefs } from '@/utils/aria';
import { composeEventHandlers, splitCompatibilityAttributes } from '@/utils/dom/attributes';
import RangeSliderTooltip from './range-slider-tooltip.vue';
import type { RangeSliderPart, RangeSliderProps, RangeSliderTrackSlotProps } from './types';
import { useRangeSlider } from './useRangeSlider';

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
const labelId = computed(() => `${props.id ?? generatedId}-label`);

const {
    nativeElements,
    setInputRef,
    focus,
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
} = useRangeSlider(props, (value) => emit('update:modelValue', value));

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
        'data-disabled': toPresenceAttribute(control.disabled),
        'data-invalid': toPresenceAttribute(control.invalid),
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
            const inputAttrs = inputAttrsByThumb.value[index] ?? {};
            const { compatibilityClass, compatibilityStyle, forwardedAttributes } =
                splitCompatibilityAttributes(inputAttrs);

            return Object.assign({}, forwardedAttributes, {
                ...getPartAttrs('input', {
                    class: ['rp-range-slider__native', `rp-range-slider__native--${thumb}`],
                    compatibilityClass,
                    compatibilityStyle,
                }),
                onInput: composeEventHandlers<InputEvent>(
                    (event) => onInput(thumb, event),
                    inputAttrs.onInput,
                ),
                onFocus: composeEventHandlers<FocusEvent>(
                    () => onTooltipFocus(thumb),
                    inputAttrs.onFocus,
                ),
                onBlur: composeEventHandlers<FocusEvent>(
                    () => onTooltipBlur(thumb),
                    inputAttrs.onBlur,
                ),
                onKeydown: composeEventHandlers<KeyboardEvent>(
                    (event) => onTooltipKeydown(thumb, event),
                    inputAttrs.onKeydown,
                ),
            });
        }) as [InputHTMLAttributes, InputHTMLAttributes],
);

const groupLabelledby = computed(() =>
    mergeAriaIdRefs(control.ariaLabelledby, slots.default ? labelId.value : undefined),
);

defineExpose({ nativeElements, focus });
</script>

<style src="./range-slider.scss" lang="scss" scoped></style>
