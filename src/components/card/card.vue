<template>
    <div :class="rootClass">
        <div v-if="header || showHeader" class="rp-card__header">
            <slot name="header">{{ header }}</slot>
        </div>
        <div class="rp-card__body">
            <slot />
        </div>
        <div v-if="footer || showFooter" class="rp-card__footer">
            <slot name="footer">{{ footer }}</slot>
        </div>
    </div>
</template>

<script lang="ts" setup vapor>
import { computed } from 'vue';
import { bem } from '@/utils/bem';
import type { CardProps } from './types';

defineOptions({ name: 'RpCard' });

const props = withDefaults(defineProps<CardProps>(), {
    variant: 'outline',
    size: 'md',
});

const rootClass = computed(() =>
    bem('rp-card', props.variant, props.size),
);
</script>

<style lang="scss" scoped>
.rp-card {
    font-family: var(--rp-font-family);
    border-radius: var(--rp-radius-xl);
    color: var(--rp-color-text);
    overflow: hidden;

    // ── Variants ──
    &--elevated {
        background-color: var(--rp-color-surface);
        box-shadow: var(--rp-shadow-md);
    }

    &--outline {
        background-color: var(--rp-color-surface);
        border: 1px solid var(--rp-color-border);
    }

    &--filled {
        background-color: var(--rp-color-gray-50);
    }

    // ── Sizes (padding) ──
    &--sm &__body,
    &--sm &__header,
    &--sm &__footer {
        padding: var(--rp-spacing-3);
    }

    &--md &__body,
    &--md &__header,
    &--md &__footer {
        padding: var(--rp-spacing-4) var(--rp-spacing-5);
    }

    &--lg &__body,
    &--lg &__header,
    &--lg &__footer {
        padding: var(--rp-spacing-6);
    }

    &__header {
        font-weight: var(--rp-font-weight-semibold);
        border-bottom: 1px solid var(--rp-color-border);
    }

    &__footer {
        border-top: 1px solid var(--rp-color-border);
    }
}
</style>
