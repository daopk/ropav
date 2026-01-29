<template>
    <span class="rp-badge">
        <slot />
        <sup v-if="show" :class="indicatorClass">
            <template v-if="!dot">{{ displayContent }}</template>
        </sup>
    </span>
</template>

<script lang="ts" setup vapor>
import { computed } from 'vue';
import { bem } from '@/utils/bem';
import type { BadgeProps } from './types';

defineOptions({ name: 'RpBadge' });

const props = withDefaults(defineProps<BadgeProps>(), {
    color: 'danger',
    size: 'md',
    dot: false,
    bordered: false,
    placement: 'corner',
    show: true,
});

const displayContent = computed(() => {
    if (props.dot) return '';
    if (props.max != null && typeof props.content === 'number' && props.content > props.max) {
        return `${props.max}+`;
    }
    return props.content ?? '';
});

const indicatorClass = computed(() =>
    bem('rp-badge__indicator', props.color, props.size, props.placement, { dot: props.dot, bordered: props.bordered }),
);
</script>

<style lang="scss" scoped>
.rp-badge {
    position: relative;
    display: inline-flex;
    vertical-align: middle;

    &__indicator {
        position: absolute;
        top: 0;
        right: 0;
        transform: translate(30%, -30%);

        &--edge {
            top: 14%;
            right: 14%;
            transform: translate(50%, -50%);
        }
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-family: var(--rp-font-family);
        font-weight: var(--rp-font-weight-semibold);
        line-height: 1;
        white-space: nowrap;
        border-radius: var(--rp-radius-full);
        z-index: 1;

        &--bordered {
            border: 2px solid var(--rp-color-white);
        }

        @each $name in primary, secondary, success, warning, danger {
            &--#{$name} { --_badge-color: var(--rp-color-#{$name}); }
        }

        background-color: var(--_badge-color);
        color: var(--rp-color-white);

        // ── Sizes (number) ──
        &--sm {
            min-width: 6px;
            height: 12px;
            padding: 0 3px;
            font-size: 8px;
        }

        &--md {
            min-width: 10px;
            height: 16px;
            padding: 0 3px;
            font-size: 10px;
        }

        &--lg {
            min-width: 12px;
            height: 20px;
            padding: 0 4px;
            font-size: 11px;
        }

        // ── Dot ──
        &--dot {
            padding: 0;
            min-width: 0;
        }

        &--dot.rp-badge__indicator--sm {
            width: 6px;
            height: 6px;
        }

        &--dot.rp-badge__indicator--md {
            width: 8px;
            height: 8px;
        }

        &--dot.rp-badge__indicator--lg {
            width: 10px;
            height: 10px;
        }
    }
}
</style>
