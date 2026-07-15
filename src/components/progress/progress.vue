<template>
    <div v-bind="rootAttrs">
        <span
            v-if="$slots.default || (!isIndeterminate && ($slots.value || showValue))"
            class="rp-progress__header"
        >
            <span
                v-if="$slots.default"
                v-bind="getPartAttrs('label', { class: 'rp-progress__label' })"
            >
                <slot />
            </span>
            <span
                v-if="!isIndeterminate && ($slots.value || showValue)"
                v-bind="getPartAttrs('value', { class: 'rp-progress__value' })"
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
        <span v-bind="getPartAttrs('track', { class: 'rp-progress__track' })" aria-hidden="true">
            <span v-bind="getPartAttrs('indicator', { class: 'rp-progress__indicator' })" />
        </span>
    </div>
</template>

<script lang="ts" setup vapor>
import { computed } from 'vue';
import { useStylesApi } from '@/styles-api';
import type { ProgressPart, ProgressProps } from './types';
import { useProgress } from './useProgress';

defineOptions({ name: 'RpProgress', inheritAttrs: false });

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
const { getPartAttrs, getRootAttrs } = useStylesApi<ProgressPart>(props, 'root');
const rootAttrs = computed(() =>
    getRootAttrs({
        id: control.id,
        class: rootClass.value,
        style: rootStyle.value,
        role: 'progressbar',
        'data-state': isIndeterminate.value ? 'indeterminate' : 'determinate',
        'aria-label': props.ariaLabel || undefined,
        'aria-labelledby': control.ariaLabelledby,
        'aria-describedby': control.ariaDescribedby,
        'aria-valuemin': ariaValueMin.value,
        'aria-valuemax': ariaValueMax.value,
        'aria-valuenow': ariaValueNow.value,
        'aria-valuetext': ariaValueText.value,
    }),
);
</script>

<style src="./progress.scss" lang="scss" scoped></style>
