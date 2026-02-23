<template>
    <button :class="rootClass" :disabled="disabled || loading || undefined" :type="type">
        <Spinner v-if="loading" size="sm" color="current" />
        <span v-if="$slots.prefix && !loading" class="rp-button__prefix">
            <slot name="prefix" />
        </span>
        <span class="rp-button__label">
            <slot />
        </span>
        <span v-if="$slots.suffix" class="rp-button__suffix">
            <slot name="suffix" />
        </span>
    </button>
</template>

<script lang="ts" setup vapor>
import { computed } from 'vue';
import { bem } from '@/utils/bem';
import Spinner from '@/components/spinner/spinner.vue';
import type { ButtonProps } from './types';

defineOptions({ name: 'RpButton' });

const props = withDefaults(defineProps<ButtonProps>(), {
    variant: 'solid',
    color: 'primary',
    size: 'md',
    type: 'button',
    disabled: false,
    loading: false,
    block: false,
});

const rootClass = computed(() =>
    bem('rp-button', props.variant, props.color, props.size, {
        block: props.block,
        loading: props.loading,
    }),
);
</script>

<style lang="scss" scoped>
.rp-button {
    @include flex-center;
    gap: var(--rp-spacing-2);
    font-family: var(--rp-font-family);
    font-weight: var(--rp-font-weight-normal);
    line-height: 1;
    border: 1px solid transparent;
    cursor: pointer;
    transition: background-color var(--rp-transition-fast),
        color var(--rp-transition-fast),
        border-color var(--rp-transition-fast),
        box-shadow var(--rp-transition-fast);
    white-space: nowrap;
    user-select: none;

    @each $name in primary, secondary, success, warning, danger {
        &--#{$name} { --_btn-color: var(--rp-color-#{$name}); }
    }

    // ── Sizes ──
    &--sm {
        height: var(--rp-size-sm);
        padding: 0 var(--rp-spacing-3);
        font-size: var(--rp-font-size-sm);
        border-radius: var(--rp-radius-md);
    }

    &--md {
        height: var(--rp-size-md);
        padding: 0 var(--rp-spacing-4);
        font-size: var(--rp-font-size-base);
        border-radius: var(--rp-radius-lg);
    }

    &--lg {
        height: var(--rp-size-lg);
        padding: 0 var(--rp-spacing-6);
        font-size: var(--rp-font-size-lg);
        border-radius: var(--rp-radius-lg);
    }

    // ── Solid ──
    &--solid {
        background-color: var(--_btn-color);
        color: var(--rp-color-white);

        &:hover:not(:disabled) {
            background-color: color-mix(in srgb, var(--_btn-color) 85%, black);
        }

        &:active:not(:disabled) {
            background-color: color-mix(in srgb, var(--_btn-color) 78%, black);
        }
    }

    // ── Outline & Ghost (shared hover/active) ──
    &--outline,
    &--ghost {
        background-color: transparent;
        color: var(--_btn-color);

        &:hover:not(:disabled) {
            background-color: color-mix(in srgb, var(--_btn-color) 8%, transparent);
        }

        &:active:not(:disabled) {
            background-color: color-mix(in srgb, var(--_btn-color) 15%, transparent);
        }
    }

    &--outline {
        border-color: var(--_btn-color);
    }

    // ── Link ──
    &--link {
        background-color: transparent;
        color: var(--_btn-color);
        border: none;
        padding: 0;
        height: auto;
        text-decoration: none;

        &:hover:not(:disabled) {
            text-decoration: underline;
        }
    }

    // ── States ──
    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    &:focus-visible {
        outline: 2px solid var(--rp-color-primary);
        outline-offset: 2px;
    }

    &--block {
        display: flex;
        width: 100%;
    }

    &--loading {
        cursor: wait;
    }

    &__prefix,
    &__suffix {
        display: inline-flex;
        align-items: center;
        flex-shrink: 0;
    }
}
</style>
