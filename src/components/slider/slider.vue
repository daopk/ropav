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
            @mouseenter="onTooltipMouseEnter"
            @mouseleave="onTooltipMouseLeave"
            @focusin="onTooltipFocusIn"
            @focusout="onTooltipFocusOut"
            @keydown="onTooltipKeydown"
        >
            <span v-bind="getPartAttrs('range', { class: 'rp-slider__bar' })" aria-hidden="true" />

            <input
                v-bind="nativeInputAttrs"
                :id="control.id"
                ref="inputRef"
                :name="name"
                type="range"
                :value="normalizedValue"
                :min="nativeMin"
                :max="nativeMax"
                :step="nativeStep"
                :orient="orientation === 'vertical' ? 'vertical' : undefined"
                :disabled="control.disabled || undefined"
                :aria-label="ariaLabel || undefined"
                :aria-labelledby="control.ariaLabelledby"
                :aria-describedby="control.ariaDescribedby"
                :aria-orientation="orientation === 'vertical' ? 'vertical' : undefined"
                :aria-valuetext="ariaValueText"
                :data-disabled="presence(control.disabled)"
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
                    :data-filled="presence(mark.filled)"
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

            <span
                v-if="$slots.thumb"
                v-bind="getPartAttrs('thumb', { class: 'rp-slider__thumb' })"
                aria-hidden="true"
            >
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
                :offset="tooltipOffset"
                :open="tooltipOpen"
                :open-delay="tooltipOpenDelay"
                :arrow="tooltipArrow"
                decorative
            >
                <span class="rp-slider__tooltip-anchor" aria-hidden="true" />
            </Tooltip>
        </span>
    </label>
</template>

<script lang="ts" setup vapor>
import { computed, ref, useSlots, type InputHTMLAttributes } from 'vue';
import { presence, useStylesApi } from '@/styles-api';
import Tooltip from '../tooltip/tooltip.vue';
import type { SliderPart, SliderProps } from './types';
import { useSlider } from './useSlider';

defineOptions({ name: 'RpSlider', inheritAttrs: false });

const props = withDefaults(defineProps<SliderProps>(), {
    min: 0,
    max: 100,
    step: 1,
    marks: () => [],
    tooltip: 'hover',
    orientation: 'horizontal',
    disabled: undefined,
});

const emit = defineEmits<{
    'update:modelValue': [value: number];
}>();

const inputRef = ref<HTMLInputElement | null>(null);
const slots = useSlots();

const {
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
    trackStyle,
    tooltipVisible,
    tooltipOpen,
    tooltipPlacement,
    tooltipId,
    tooltipColor,
    tooltipOffset,
    tooltipOpenDelay,
    tooltipArrow,
    tooltipContent,
    onInput,
    onTooltipPointerDown,
    onTooltipMouseEnter,
    onTooltipMouseLeave,
    onTooltipFocusIn,
    onTooltipFocusOut,
    onTooltipKeydown,
} = useSlider(props, (value) => {
    emit('update:modelValue', value);
});

const { getPartAttrs, getRootAttrs } = useStylesApi<SliderPart>(props, 'root');
const rootAttrs = computed(() =>
    getRootAttrs({
        class: [rootClass.value, { 'rp-slider--custom-thumb': Boolean(slots.thumb) }],
        style: trackStyle.value,
        'data-disabled': presence(control.disabled),
        'data-orientation': props.orientation,
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

function focus(options?: FocusOptions) {
    inputRef.value?.focus(options);
}

defineExpose({ nativeElement: inputRef, focus });
</script>

<style src="./slider.scss" lang="scss" scoped></style>
