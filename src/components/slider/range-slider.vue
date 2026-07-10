<template>
    <div
        ref="rangeSliderRef"
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
        :aria-invalid="control.invalid || undefined"
        :aria-required="control.required || undefined"
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
                :id="nativeIds[0]"
                :name="nativeNames[0]"
                class="rp-range-slider__native rp-range-slider__native--lower"
                type="range"
                :value="normalizedValue[0]"
                :min="nativeMin[0]"
                :max="nativeMax[0]"
                :step="nativeStep"
                :orient="orientation === 'vertical' ? 'vertical' : undefined"
                :disabled="control.disabled || undefined"
                :required="control.required || undefined"
                :aria-label="ariaLabels[0]"
                :aria-describedby="control.ariaDescribedby"
                :aria-orientation="orientation === 'vertical' ? 'vertical' : undefined"
                :aria-invalid="control.invalid || undefined"
                :aria-required="control.required || undefined"
                :aria-valuetext="ariaValueText[0]"
                @input="onInput('lower', $event)"
                @focus="onTooltipFocus('lower')"
                @blur="onTooltipBlur('lower')"
                @keydown="onTooltipKeydown('lower', $event)"
            />

            <input
                :id="nativeIds[1]"
                :name="nativeNames[1]"
                class="rp-range-slider__native rp-range-slider__native--upper"
                type="range"
                :value="normalizedValue[1]"
                :min="nativeMin[1]"
                :max="nativeMax[1]"
                :step="nativeStep"
                :orient="orientation === 'vertical' ? 'vertical' : undefined"
                :disabled="control.disabled || undefined"
                :required="control.required || undefined"
                :aria-label="ariaLabels[1]"
                :aria-describedby="control.ariaDescribedby"
                :aria-orientation="orientation === 'vertical' ? 'vertical' : undefined"
                :aria-invalid="control.invalid || undefined"
                :aria-required="control.required || undefined"
                :aria-valuetext="ariaValueText[1]"
                @input="onInput('upper', $event)"
                @focus="onTooltipFocus('upper')"
                @blur="onTooltipBlur('upper')"
                @keydown="onTooltipKeydown('upper', $event)"
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
                    class="rp-range-slider__thumb rp-range-slider__thumb--lower"
                    data-range-slider-thumb="lower"
                >
                    <span class="rp-range-slider__thumb-content">
                        <slot
                            name="thumb"
                            thumb="lower"
                            :index="0"
                            :value="normalizedValue[0]"
                            :formatted-value="formattedValue[0]"
                            :percent="valuePercent[0]"
                        />
                    </span>

                    <Tooltip
                        v-if="tooltipVisible"
                        :id="tooltipIds[0]"
                        class="rp-range-slider__tooltip rp-range-slider__tooltip--lower"
                        :content="tooltipContent[0]"
                        :placement="tooltipPlacement"
                        :color="tooltipColor"
                        :offset="tooltipOffset"
                        :open="tooltipOpen"
                        :open-delay="tooltipOpenDelay"
                        :arrow="tooltipArrow"
                        decorative
                    >
                        <span class="rp-range-slider__tooltip-anchor" />
                    </Tooltip>
                </span>

                <span
                    class="rp-range-slider__thumb rp-range-slider__thumb--upper"
                    data-range-slider-thumb="upper"
                >
                    <span class="rp-range-slider__thumb-content">
                        <slot
                            name="thumb"
                            thumb="upper"
                            :index="1"
                            :value="normalizedValue[1]"
                            :formatted-value="formattedValue[1]"
                            :percent="valuePercent[1]"
                        />
                    </span>

                    <Tooltip
                        v-if="tooltipVisible"
                        :id="tooltipIds[1]"
                        class="rp-range-slider__tooltip rp-range-slider__tooltip--upper"
                        :content="tooltipContent[1]"
                        :placement="tooltipPlacement"
                        :color="tooltipColor"
                        :offset="tooltipOffset"
                        :open="tooltipOpen"
                        :open-delay="tooltipOpenDelay"
                        :arrow="tooltipArrow"
                        decorative
                    >
                        <span class="rp-range-slider__tooltip-anchor" />
                    </Tooltip>
                </span>

                <Tooltip
                    v-if="tooltipVisible"
                    :id="mergedTooltipId"
                    class="rp-range-slider__tooltip rp-range-slider__tooltip--merged"
                    :content="mergedTooltipContent"
                    :placement="tooltipPlacement"
                    :color="tooltipColor"
                    :offset="tooltipOffset"
                    :open="tooltipOpen"
                    :open-delay="tooltipOpenDelay"
                    :arrow="tooltipArrow"
                    decorative
                >
                    <span class="rp-range-slider__tooltip-anchor" />
                </Tooltip>
            </span>
        </span>
    </div>
</template>

<script lang="ts" setup vapor>
import { computed, ref, useId, useSlots } from 'vue';
import Tooltip from '../tooltip/tooltip.vue';
import type { RangeSliderProps } from './types';
import { useRangeSlider } from './useRangeSlider';
import { useRangeSliderTooltipCollision } from './useRangeSliderTooltipCollision';

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
    required: undefined,
    invalid: undefined,
    valid: undefined,
});

const emit = defineEmits<{
    'update:modelValue': [value: [number, number]];
}>();

const slots = useSlots();
const generatedId = useId();
const rangeSliderRef = ref<HTMLElement | null>(null);
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
    tooltipOpenDelay,
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

const { tooltipsOverlapping } = useRangeSliderTooltipCollision(rangeSliderRef);

const groupLabelledby = computed(() => {
    const values = [control.ariaLabelledby, slots.default ? labelId.value : undefined]
        .flatMap((value) => value?.split(/\s+/) ?? [])
        .filter(Boolean);

    return values.length ? Array.from(new Set(values)).join(' ') : undefined;
});
</script>

<style src="./range-slider.scss" lang="scss" scoped></style>
