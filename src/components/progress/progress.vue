<template>
    <div
        :id="control.id"
        :class="rootClass"
        :style="rootStyle"
        role="progressbar"
        :data-state="isIndeterminate ? 'indeterminate' : 'determinate'"
        :aria-label="ariaLabel || undefined"
        :aria-labelledby="control.ariaLabelledby"
        :aria-describedby="control.ariaDescribedby"
        :aria-valuemin="ariaValueMin"
        :aria-valuemax="ariaValueMax"
        :aria-valuenow="ariaValueNow"
        :aria-valuetext="ariaValueText"
    >
        <span
            v-if="$slots.default || (!isIndeterminate && ($slots.value || showValue))"
            class="rp-progress__header"
        >
            <span v-if="$slots.default" class="rp-progress__label">
                <slot />
            </span>
            <span
                v-if="!isIndeterminate && ($slots.value || showValue)"
                class="rp-progress__value"
                aria-hidden="true"
            >
                <slot
                    v-if="$slots.value"
                    name="value"
                    :value="normalizedValue"
                    :formatted-value="formattedValue"
                    :percent="valuePercent"
                />
                <template v-else>{{ formattedValue }}</template>
            </span>
        </span>
        <span class="rp-progress__track" aria-hidden="true">
            <span class="rp-progress__indicator" />
        </span>
    </div>
</template>

<script lang="ts" setup vapor>
import type { ProgressProps } from './types';
import { useProgress } from './useProgress';

defineOptions({ name: 'RpProgress' });

const props = withDefaults(defineProps<ProgressProps>(), {
    min: 0,
    max: 100,
    indeterminate: false,
    showValue: false,
});

const {
    control,
    rootClass,
    rootStyle,
    isIndeterminate,
    normalizedValue,
    valuePercent,
    formattedValue,
    ariaValueText,
    ariaValueMin,
    ariaValueMax,
    ariaValueNow,
} = useProgress(props);
</script>

<style src="./progress.scss" lang="scss" scoped></style>
