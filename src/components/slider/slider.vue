<template>
    <label
        :class="[rootClass, { 'rp-slider--custom-thumb': $slots.thumb }]"
        :data-disabled="control.disabled || undefined"
        :style="trackStyle"
    >
        <span v-if="$slots.default || $slots.value" class="rp-slider__header">
            <span v-if="$slots.default" class="rp-slider__label">
                <slot />
            </span>
            <span v-if="$slots.value" class="rp-slider__value" aria-hidden="true">
                <slot
                    name="value"
                    :value="normalizedValue"
                    :formatted-value="formattedValue"
                    :percent="valuePercent"
                />
            </span>
        </span>
        <span
            class="rp-slider__track"
            @mouseenter="openTooltip"
            @mouseleave="closeTooltip"
            @focusin="openTooltip"
            @focusout="closeTooltip"
            @keydown="onTooltipKeydown"
        >
            <span class="rp-slider__bar" aria-hidden="true" />

            <input
                :id="control.id"
                :name="name"
                class="rp-slider__native"
                type="range"
                :value="normalizedValue"
                :min="nativeMin"
                :max="nativeMax"
                :step="nativeStep"
                :orient="orientation === 'vertical' ? 'vertical' : undefined"
                :disabled="control.disabled || undefined"
                :required="control.required || undefined"
                :aria-label="ariaLabel || undefined"
                :aria-labelledby="control.ariaLabelledby"
                :aria-describedby="control.ariaDescribedby"
                :aria-orientation="orientation === 'vertical' ? 'vertical' : undefined"
                :aria-invalid="control.invalid || undefined"
                :aria-required="control.required || undefined"
                :aria-valuetext="ariaValueText"
                @input="onInput"
            />

            <span v-if="markItems.length" class="rp-slider__marks" aria-hidden="true">
                <span
                    v-for="mark in markItems"
                    :key="mark.key"
                    class="rp-slider__mark"
                    :class="{ 'rp-slider__mark--filled': mark.filled }"
                    :style="mark.style"
                >
                    <span class="rp-slider__mark-dot" />
                    <span v-if="mark.hasLabel" class="rp-slider__mark-label">
                        {{ mark.label }}
                    </span>
                </span>
            </span>

            <span v-if="$slots.thumb" class="rp-slider__thumb" aria-hidden="true">
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
                class="rp-slider__tooltip"
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
import Tooltip from '../tooltip/tooltip.vue';
import type { SliderProps } from './types';
import { useSlider } from './useSlider';

defineOptions({ name: 'RpSlider' });

const props = withDefaults(defineProps<SliderProps>(), {
    min: 0,
    max: 100,
    step: 1,
    marks: () => [],
    tooltip: 'hover',
    orientation: 'horizontal',
    disabled: undefined,
    required: undefined,
    invalid: undefined,
    valid: undefined,
});

const emit = defineEmits<{
    'update:modelValue': [value: number];
}>();

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
    openTooltip,
    closeTooltip,
    onTooltipKeydown,
} = useSlider(props, (value) => {
    emit('update:modelValue', value);
});
</script>

<style src="./slider.scss" lang="scss" scoped></style>
