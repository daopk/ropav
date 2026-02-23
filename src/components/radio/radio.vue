<template>
    <label :class="rootClass">
        <input
            type="radio"
            class="rp-radio__native"
            :value="value"
            :checked="isChecked"
            :disabled="isDisabled || undefined"
            @change="onSelect"
        />
        <span class="rp-radio__dot" />
        <span class="rp-radio__label">
            <slot>{{ label }}</slot>
        </span>
    </label>
</template>

<script lang="ts" setup vapor>
import { computed, inject } from 'vue';
import { bem } from '@/utils/bem';
import { radioGroupKey } from './types';
import type { RadioProps } from './types';

defineOptions({ name: 'RpRadio' });

const props = withDefaults(defineProps<RadioProps>(), {
    label: '',
    disabled: false,
});

const group = inject(radioGroupKey, null);

const isChecked = computed(() => group ? group.modelValue === props.value : false);
const isDisabled = computed(() => props.disabled || (group?.disabled ?? false));
const size = computed(() => group?.size ?? 'md');

const rootClass = computed(() =>
    bem('rp-radio', size.value, {
        checked: isChecked.value,
        disabled: isDisabled.value,
    }),
);

function onSelect() {
    if (isDisabled.value) return;
    group?.select(props.value);
}
</script>

<style lang="scss" scoped>
.rp-radio {
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
        --_radio-size: 16px;
        --_radio-dot: 6px;
    }

    &--md {
        gap: var(--rp-spacing-2);
        font-size: var(--rp-font-size-base);
        --_radio-size: 18px;
        --_radio-dot: 8px;
    }

    &--lg {
        gap: var(--rp-spacing-2);
        font-size: var(--rp-font-size-lg);
        --_radio-size: 22px;
        --_radio-dot: 10px;
    }

    &__native {
        @include visually-hidden;
        pointer-events: none;
    }

    &__dot {
        @include flex-center;
        width: var(--_radio-size);
        height: var(--_radio-size);
        flex-shrink: 0;
        border: 2px solid var(--rp-color-gray-300);
        border-radius: var(--rp-radius-full);
        background-color: var(--rp-color-background);
        transition:
            background-color var(--rp-transition-fast),
            border-color var(--rp-transition-fast);

        &::after {
            content: '';
            width: var(--_radio-dot);
            height: var(--_radio-dot);
            border-radius: var(--rp-radius-full);
            background-color: var(--rp-color-white);
            transform: scale(0);
            transition: transform var(--rp-transition-fast);
        }
    }

    &--checked &__dot {
        background-color: var(--rp-color-primary);
        border-color: var(--rp-color-primary);

        &::after {
            transform: scale(1);
        }
    }

    &__label {
        line-height: 1.4;
        color: var(--rp-color-text);
    }
}
</style>
