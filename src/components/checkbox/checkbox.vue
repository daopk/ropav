<template>
    <label :class="rootClass">
        <input
            type="checkbox"
            class="rp-checkbox__native"
            :checked="modelValue"
            :disabled="disabled"
            :indeterminate="indeterminate"
            @change="onChange"
        />
        <span class="rp-checkbox__box">
            <MinusIcon v-if="indeterminate" class="rp-checkbox__icon" />
            <CheckIcon v-else-if="modelValue" class="rp-checkbox__icon" />
        </span>
        <span class="rp-checkbox__label">
            <slot>{{ label }}</slot>
        </span>
    </label>
</template>

<script lang="ts" setup vapor>
import { computed } from 'vue';
import { bem } from '@/utils/bem';
import { CheckIcon, MinusIcon } from '@/components/_internal/icons';
import type { CheckboxProps } from './types';

defineOptions({ name: 'RpCheckbox' });

const props = withDefaults(defineProps<CheckboxProps>(), {
    modelValue: false,
    label: '',
    size: 'md',
    disabled: false,
    indeterminate: false,
});

const emit = defineEmits<{
    'update:modelValue': [value: boolean];
}>();

const rootClass = computed(() =>
    bem('rp-checkbox', props.size, {
        checked: props.modelValue,
        indeterminate: props.indeterminate,
        disabled: props.disabled,
    }),
);

function onChange(e: Event) {
    emit('update:modelValue', (e.target as HTMLInputElement).checked);
}
</script>

<style lang="scss" scoped>
.rp-checkbox {
    display: inline-flex;
    align-items: center;
    cursor: pointer;
    font-family: var(--rp-font-family);
    user-select: none;

    &--disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    // ── Sizes ──
    &--sm {
        gap: var(--rp-spacing-1);
        font-size: var(--rp-font-size-sm);
        --_checkbox-size: 16px;
    }

    &--md {
        gap: var(--rp-spacing-2);
        font-size: var(--rp-font-size-base);
        --_checkbox-size: 18px;
    }

    &--lg {
        gap: var(--rp-spacing-2);
        font-size: var(--rp-font-size-lg);
        --_checkbox-size: 22px;
    }

    &__native {
        @include visually-hidden;
        pointer-events: none;
    }

    &__box {
        @include flex-center;
        width: var(--_checkbox-size);
        height: var(--_checkbox-size);
        flex-shrink: 0;
        border: 2px solid var(--rp-color-gray-300);
        border-radius: var(--rp-radius-base);
        background-color: var(--rp-color-background);
        transition:
            background-color var(--rp-transition-fast),
            border-color var(--rp-transition-fast);
    }

    &--checked &__box,
    &--indeterminate &__box {
        background-color: var(--rp-color-primary);
        border-color: var(--rp-color-primary);
    }

    &__icon {
        width: 12px;
        height: 12px;
        color: var(--rp-color-white);
    }

    &__label {
        line-height: 1.4;
        color: var(--rp-color-text);
    }
}
</style>
