<template>
    <span :class="rootClass">
        <slot />
        <button v-if="closable" class="rp-tag__close" @click="emit('close')">
            <CloseIcon />
        </button>
    </span>
</template>

<script lang="ts" setup vapor>
import { computed } from 'vue';
import { bem } from '@/utils/bem';
import { CloseIcon } from '@/components/_internal/icons';
import type { TagProps } from './types';

defineOptions({ name: 'RpTag' });

const props = withDefaults(defineProps<TagProps>(), {
    variant: 'subtle',
    color: 'primary',
    size: 'md',
    closable: false,
});

const emit = defineEmits<{
    close: [];
}>();

const rootClass = computed(() =>
    bem('rp-tag', props.variant, props.color, props.size, {
        closable: props.closable,
    }),
);
</script>

<style lang="scss" scoped>
.rp-tag {
    @include flex-center;
    gap: var(--rp-spacing-1);
    font-family: var(--rp-font-family);
    font-weight: var(--rp-font-weight-medium);
    line-height: 1;
    white-space: nowrap;
    border: 1px solid transparent;

    @each $name in primary, secondary, success, warning, danger {
        &--#{$name} { --_tag-color: var(--rp-color-#{$name}); }
    }

    // ── Sizes ──
    &--sm {
        height: 20px;
        padding: 0 var(--rp-spacing-2);
        font-size: var(--rp-font-size-xs);
        border-radius: var(--rp-radius-md);
    }

    &--md {
        height: 24px;
        padding: 0 var(--rp-spacing-3);
        font-size: var(--rp-font-size-sm);
        border-radius: var(--rp-radius-md);
    }

    &--lg {
        height: 28px;
        padding: 0 var(--rp-spacing-3);
        font-size: var(--rp-font-size-base);
        border-radius: var(--rp-radius-lg);
    }

    // ── Closable padding adjustment ──
    &--closable.rp-tag--sm { padding-right: var(--rp-spacing-1); }
    &--closable.rp-tag--md { padding-right: var(--rp-spacing-1); }
    &--closable.rp-tag--lg { padding-right: var(--rp-spacing-2); }

    // ── Solid ──
    &--solid {
        background-color: var(--_tag-color);
        color: var(--rp-color-white);
    }

    // ── Outline ──
    &--outline {
        background-color: transparent;
        color: var(--_tag-color);
        border-color: var(--_tag-color);
    }

    // ── Subtle ──
    &--subtle {
        background-color: color-mix(in srgb, var(--_tag-color) 12%, transparent);
        color: var(--_tag-color);
    }

    &__close {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 1em;
        height: 1em;
        padding: 0;
        background: none;
        border: none;
        color: inherit;
        opacity: 0.6;
        cursor: pointer;
        border-radius: var(--rp-radius-sm);
        transition: opacity var(--rp-transition-fast);
        flex-shrink: 0;

        &:hover {
            opacity: 1;
        }

        svg {
            width: 100%;
            height: 100%;
        }
    }
}
</style>
