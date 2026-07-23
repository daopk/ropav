<template>
    <label v-bind="rootAttrs">
        <span v-if="$slots.default || $slots.value" class="rp-slider__header">
            <span
                v-if="$slots.default"
                v-bind="getPartAttrs('label', { class: 'rp-slider__label' })"
            >
                <slot />
            </span>
            <span
                v-if="$slots.value"
                v-bind="getPartAttrs('value', { class: 'rp-slider__value' })"
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
            v-bind="getPartAttrs('track', { class: 'rp-slider__track' })"
            @pointerdown="onTooltipPointerDown"
            @pointerenter="onTooltipTrackEnter"
            @pointerleave="onTooltipTrackLeave"
            @pointermove="onTooltipPointerMove"
            @focusin="onTooltipFocusIn"
            @focusout="onTooltipFocusOut"
            @keydown="onTooltipKeydown"
        >
            <span class="rp-slider__rail" aria-hidden="true" />
            <span
                v-if="$slots['track-underlay']"
                class="rp-slider__track-layer rp-slider__track-underlay"
                aria-hidden="true"
            >
                <slot name="track-underlay" v-bind="trackSlotProps" />
            </span>
            <span v-bind="getPartAttrs('range', { class: 'rp-slider__bar' })" aria-hidden="true" />
            <span
                v-if="$slots['track-overlay']"
                class="rp-slider__track-layer rp-slider__track-overlay"
                aria-hidden="true"
            >
                <slot name="track-overlay" v-bind="trackSlotProps" />
            </span>

            <span v-if="tooltipAnchor === 'pointer'" class="rp-slider__travel" aria-hidden="true" />

            <input
                v-bind="nativeInputAttrs"
                :id="control.id"
                ref="inputRef"
                :name="name"
                :form="control.form ?? nativeInputAttrs.form"
                type="range"
                :value="normalizedValue"
                :min="nativeMin"
                :max="nativeMax"
                :step="nativeStep"
                :orient="orientation === 'vertical' ? 'vertical' : undefined"
                :disabled="control.disabled || undefined"
                :required="props.required ?? nativeInputAttrs.required"
                :aria-label="ariaLabel || undefined"
                :aria-labelledby="control.ariaLabelledby"
                :aria-describedby="control.ariaDescribedby"
                :aria-orientation="orientation === 'vertical' ? 'vertical' : undefined"
                :aria-valuetext="ariaValueText"
                :aria-invalid="
                    props.invalid === undefined
                        ? nativeInputAttrs['aria-invalid']
                        : control.invalid || undefined
                "
                :aria-required="props.required ?? nativeInputAttrs.required"
                :data-disabled="toPresenceAttribute(control.disabled)"
                :data-invalid="toPresenceAttribute(control.invalid)"
            />

            <span v-if="markItems.length" class="rp-slider__marks" aria-hidden="true">
                <span
                    v-for="mark in markItems"
                    :key="mark.key"
                    v-bind="
                        getPartAttrs('mark', {
                            class: ['rp-slider__mark', { 'rp-slider__mark--filled': mark.filled }],
                            style: mark.style,
                        })
                    "
                    :data-filled="toPresenceAttribute(mark.filled)"
                >
                    <span class="rp-slider__mark-dot" />
                    <span
                        v-if="mark.hasLabel"
                        v-bind="getPartAttrs('markLabel', { class: 'rp-slider__mark-label' })"
                    >
                        {{ mark.label }}
                    </span>
                </span>
            </span>

            <span v-bind="getPartAttrs('thumb', { class: 'rp-slider__thumb' })" aria-hidden="true">
                <span class="rp-slider__thumb-content">
                    <slot
                        name="thumb"
                        :value="normalizedValue"
                        :formatted-value="formattedValue"
                        :percent="valuePercent"
                    />
                </span>
            </span>

            <Tooltip
                v-if="tooltipVisible"
                :id="tooltipId"
                :class-names="tooltipClassNames"
                :styles="tooltipStyles"
                :content="tooltipContent"
                :placement="tooltipPlacement"
                :color="tooltipColor"
                :auto-contrast="tooltipAutoContrast"
                :contrast-color="tooltipContrastColor"
                :offset="tooltipOffset"
                :open="tooltipOpen"
                :open-delay="tooltipOpenDelay"
                :arrow="tooltipArrow"
                decorative
            >
                <span class="rp-slider__tooltip-anchor" aria-hidden="true" />
                <template #content>
                    <slot
                        name="tooltip-content"
                        :value="tooltipValue"
                        :formatted-value="tooltipFormattedValue"
                        :percent="tooltipPercent"
                        :anchor="tooltipAnchor"
                    >
                        {{ tooltipContent }}
                    </slot>
                </template>
            </Tooltip>
        </span>
    </label>
</template>

<script lang="ts" setup vapor>
import { computed, type InputHTMLAttributes } from 'vue';
import { useStylesApi } from '@/styles-api';
import { toPresenceAttribute } from '@/utils/attributes';
import Tooltip from '../tooltip/tooltip.vue';
import type {
    SliderPart,
    SliderProps,
    SliderTooltipSlotProps,
    SliderTrackSlotProps,
} from './types';
import { useSlider } from './useSlider';

defineOptions({ name: 'RpSlider', inheritAttrs: false });

const slots = defineSlots<{
    default?(): unknown;
    value?(props: Pick<SliderTrackSlotProps, 'value' | 'formattedValue' | 'percent'>): unknown;
    'track-underlay'?(props: SliderTrackSlotProps): unknown;
    'track-overlay'?(props: SliderTrackSlotProps): unknown;
    thumb?(props: Pick<SliderTrackSlotProps, 'value' | 'formattedValue' | 'percent'>): unknown;
    'tooltip-content'?(props: SliderTooltipSlotProps): unknown;
}>();

const props = withDefaults(defineProps<SliderProps>(), {
    modelValue: undefined,
    defaultValue: undefined,
    min: 0,
    max: 100,
    step: 1,
    marks: () => [],
    tooltip: 'hover',
    thumb: 'always',
    orientation: 'horizontal',
    disabled: undefined,
    required: undefined,
    invalid: undefined,
});

const emit = defineEmits<{
    'update:modelValue': [value: number];
}>();

const {
    inputRef,
    focus,
    control,
    nativeMin,
    nativeMax,
    nativeStep,
    rootClass,
    normalizedValue,
    valuePercent,
    formattedValue,
    ariaValueText,
    markItems,
    thumbMode,
    trackSlotProps,
    trackStyle,
    trackHovered,
    dragging,
    tooltipVisible,
    tooltipOpen,
    tooltipAnchor,
    tooltipPlacement,
    tooltipId,
    tooltipColor,
    tooltipAutoContrast,
    tooltipContrastColor,
    tooltipOffset,
    tooltipOpenDelay,
    tooltipArrow,
    tooltipValue,
    tooltipPercent,
    tooltipFormattedValue,
    tooltipContent,
    onInput,
    onTooltipPointerDown,
    onTooltipPointerMove,
    onTooltipTrackEnter,
    onTooltipTrackLeave,
    onTooltipFocusIn,
    onTooltipFocusOut,
    onTooltipKeydown,
} = useSlider(props, (value) => emit('update:modelValue', value));

const { getPartAttrs, getRootAttrs } = useStylesApi<SliderPart>(props, 'root');
const rootAttrs = computed(() =>
    getRootAttrs({
        class: [rootClass.value, { 'rp-slider--custom-thumb': Boolean(slots.thumb) }],
        style: trackStyle.value,
        'data-disabled': toPresenceAttribute(control.disabled),
        'data-invalid': toPresenceAttribute(control.invalid),
        'data-orientation': props.orientation,
        'data-track-hovered': toPresenceAttribute(trackHovered.value),
        'data-dragging': toPresenceAttribute(dragging.value),
        'data-thumb-visibility': thumbMode.value === false ? 'hidden' : thumbMode.value,
    }),
);
const tooltipClassNames = computed(() => ({
    root: ['rp-slider__tooltip', props.classNames?.tooltip],
    content: 'rp-slider__tooltip-content',
}));
const tooltipStyles = computed(() => ({ root: props.styles?.tooltip }));

const nativeInputAttrs = computed<InputHTMLAttributes>(() => {
    const {
        class: compatibilityClass,
        style: compatibilityStyle,
        onInput: compatibilityOnInput,
        ...attrs
    } = props.inputAttrs ?? {};

    return {
        ...attrs,
        ...getPartAttrs('input', {
            class: 'rp-slider__native',
            compatibilityClass,
            compatibilityStyle,
        }),
        onInput(event) {
            onInput(event);
            compatibilityOnInput?.(event);
        },
    };
});

defineExpose({ nativeElement: inputRef, focus });
</script>

<style src="./slider.scss" lang="scss" scoped></style>
