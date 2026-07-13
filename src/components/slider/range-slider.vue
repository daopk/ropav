<template>
    <div
        :class="[
            rootClass,
            {
                'rp-range-slider--custom-thumb': $slots.thumb,
                'rp-range-slider--tooltips-overlapping': tooltipsOverlapping,
            },
        ]"
        :data-active-thumb="activeThumb"
        :data-disabled="control.disabled || undefined"
        :style="trackStyle"
        role="group"
        :aria-labelledby="groupLabelledby"
        :aria-describedby="control.ariaDescribedby"
    >
        <span v-if="$slots.default || $slots.value" class="rp-range-slider__header">
            <span v-if="$slots.default" :id="labelId" class="rp-range-slider__label">
                <slot />
            </span>
            <span v-if="$slots.value" class="rp-range-slider__value" aria-hidden="true">
                <slot
                    name="value"
                    :value="normalizedValue"
                    :formatted-value="formattedValue"
                    :percent="valuePercent"
                />
            </span>
        </span>

        <span
            class="rp-range-slider__track"
            @pointerdown="onTrackPointerDown"
            @mouseenter="onTooltipTrackMouseEnter"
            @mouseleave="onTooltipTrackMouseLeave"
        >
            <span class="rp-range-slider__bar" aria-hidden="true" />

            <input
                v-for="(thumb, index) in rangeSliderThumbs"
                :id="nativeIds[index]"
                :key="thumb"
                :name="nativeNames[index]"
                :class="['rp-range-slider__native', `rp-range-slider__native--${thumb}`]"
                type="range"
                :value="normalizedValue[index]"
                :min="nativeMin[index]"
                :max="nativeMax[index]"
                :step="nativeStep"
                :orient="orientation === 'vertical' ? 'vertical' : undefined"
                :disabled="control.disabled || undefined"
                :aria-label="ariaLabels[index]"
                :aria-describedby="control.ariaDescribedby"
                :aria-orientation="orientation === 'vertical' ? 'vertical' : undefined"
                :aria-valuetext="ariaValueText[index]"
                @input="onInput(thumb, $event)"
                @focus="onTooltipFocus(thumb)"
                @blur="onTooltipBlur(thumb)"
                @keydown="onTooltipKeydown(thumb, $event)"
            />

            <span v-if="markItems.length" class="rp-range-slider__marks" aria-hidden="true">
                <span
                    v-for="mark in markItems"
                    :key="mark.key"
                    class="rp-range-slider__mark"
                    :class="{ 'rp-range-slider__mark--filled': mark.filled }"
                    :style="mark.style"
                >
                    <span class="rp-range-slider__mark-dot" />
                    <span v-if="mark.hasLabel" class="rp-range-slider__mark-label">
                        {{ mark.label }}
                    </span>
                </span>
            </span>

            <span class="rp-range-slider__thumbs" aria-hidden="true">
                <span
                    v-for="(thumb, index) in rangeSliderThumbs"
                    :key="thumb"
                    :class="['rp-range-slider__thumb', `rp-range-slider__thumb--${thumb}`]"
                    :data-range-slider-thumb="thumb"
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
                    :content="tooltipContent"
                    :ids="tooltipIds"
                    :merged-content="mergedTooltipContent"
                    :merged-id="mergedTooltipId"
                    :offset="tooltipOffset"
                    :open="tooltipOpen"
                    :orientation="orientation"
                    :placement="tooltipPlacement"
                    :value-percent="valuePercent"
                    @update:overlapping="tooltipsOverlapping = $event"
                />
            </span>
        </span>
    </div>
</template>

<script lang="ts" setup vapor>
import { computed, ref, useId, useSlots } from 'vue';
import RangeSliderTooltip from './range-slider-tooltip.vue';
import type { RangeSliderProps } from './types';
import { useRangeSlider } from './useRangeSlider';

defineOptions({ name: 'RpRangeSlider' });

const props = withDefaults(defineProps<RangeSliderProps>(), {
    min: 0,
    max: 100,
    step: 1,
    minRange: 0,
    marks: () => [],
    tooltip: 'hover',
    orientation: 'horizontal',
    ariaLabel: () => ['Minimum', 'Maximum'],
    disabled: undefined,
});

const emit = defineEmits<{
    'update:modelValue': [value: [number, number]];
}>();

const slots = useSlots();
const generatedId = useId();
const tooltipsOverlapping = ref(false);
const rangeSliderThumbs = ['lower', 'upper'] as const;
const labelId = computed(() => `${props.id ?? generatedId}-label`);

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
    trackStyle,
    activeThumb,
    tooltipVisible,
    tooltipOpen,
    tooltipPlacement,
    tooltipIds,
    mergedTooltipId,
    tooltipColor,
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
} = useRangeSlider(props, (value) => {
    emit('update:modelValue', value);
});

const groupLabelledby = computed(() => {
    const values = [control.ariaLabelledby, slots.default ? labelId.value : undefined]
        .flatMap((value) => value?.split(/\s+/) ?? [])
        .filter(Boolean);

    return values.length ? Array.from(new Set(values)).join(' ') : undefined;
});
</script>

<style src="./range-slider.scss" lang="scss" scoped></style>
