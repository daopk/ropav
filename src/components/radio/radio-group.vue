<template>
    <div :class="rootClass" role="radiogroup">
        <slot />
    </div>
</template>

<script lang="ts" setup vapor>
import { computed, provide } from 'vue';
import { bem } from '@/utils/bem';
import { radioGroupKey } from './types';
import type { RadioGroupProps, RadioGroupContext } from './types';

defineOptions({ name: 'RpRadioGroup' });

const props = withDefaults(defineProps<RadioGroupProps>(), {
    modelValue: null,
    size: 'md',
    disabled: false,
    direction: 'vertical',
});

const emit = defineEmits<{
    'update:modelValue': [value: string | number | null];
}>();

const rootClass = computed(() =>
    bem('rp-radio-group', props.direction),
);

provide<RadioGroupContext>(radioGroupKey, {
    get modelValue() { return props.modelValue ?? null; },
    get size() { return props.size; },
    get disabled() { return props.disabled; },
    select(value) {
        emit('update:modelValue', value);
    },
});
</script>

<style lang="scss" scoped>
.rp-radio-group {
    display: flex;
    font-family: var(--rp-font-family);

    &--vertical {
        flex-direction: column;
        gap: var(--rp-spacing-3);
    }

    &--horizontal {
        flex-direction: row;
        flex-wrap: wrap;
        gap: var(--rp-spacing-4);
    }
}
</style>
