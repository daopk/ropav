<template>
    <label :class="rootClass">
        <input
            type="checkbox"
            class="rp-switch__native"
            :checked="modelValue"
            :disabled="disabled"
            @change="onChange"
        />
        <span class="rp-switch__track">
            <span class="rp-switch__thumb" />
        </span>
        <span class="rp-switch__label">
            <slot>{{ label }}</slot>
        </span>
    </label>
</template>

<script lang="ts" setup vapor>
import { computed } from 'vue';
import { bem } from '@/utils/bem';
import type { SwitchProps } from './types';

defineOptions({ name: 'RpSwitch' });

const props = withDefaults(defineProps<SwitchProps>(), {
    modelValue: false,
    label: '',
    size: 'md',
    disabled: false,
});

const emit = defineEmits<{
    'update:modelValue': [value: boolean];
}>();

const rootClass = computed(() =>
    bem('rp-switch', props.size, {
        checked: props.modelValue,
        disabled: props.disabled,
    }),
);

function onChange(e: Event) {
    emit('update:modelValue', (e.target as HTMLInputElement).checked);
}
</script>

<style lang="scss" scoped>
.rp-switch {
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
        gap: var(--rp-spacing-2);
        font-size: var(--rp-font-size-sm);
        --_track-w: 32px;
        --_track-h: 18px;
        --_thumb-size: 14px;
        --_thumb-offset: 2px;
    }

    &--md {
        gap: var(--rp-spacing-2);
        font-size: var(--rp-font-size-base);
        --_track-w: 40px;
        --_track-h: 22px;
        --_thumb-size: 18px;
        --_thumb-offset: 2px;
    }

    &--lg {
        gap: var(--rp-spacing-3);
        font-size: var(--rp-font-size-lg);
        --_track-w: 48px;
        --_track-h: 26px;
        --_thumb-size: 22px;
        --_thumb-offset: 2px;
    }

    &__native {
        @include visually-hidden;
        pointer-events: none;
    }

    &__track {
        position: relative;
        display: inline-flex;
        align-items: center;
        width: var(--_track-w);
        height: var(--_track-h);
        flex-shrink: 0;
        background-color: var(--rp-color-gray-300);
        border-radius: var(--rp-radius-full);
        transition: background-color var(--rp-transition-fast);
    }

    &--checked &__track {
        background-color: var(--rp-color-primary);
    }

    &__thumb {
        position: absolute;
        left: var(--_thumb-offset);
        width: var(--_thumb-size);
        height: var(--_thumb-size);
        background-color: var(--rp-color-white);
        border-radius: var(--rp-radius-full);
        box-shadow: var(--rp-shadow-sm);
        transition: transform var(--rp-transition-fast);
    }

    &--checked &__thumb {
        transform: translateX(calc(var(--_track-w) - var(--_thumb-size) - var(--_thumb-offset) * 2));
    }

    &__label {
        line-height: 1.4;
        color: var(--rp-color-text);
    }
}
</style>
