<template>
    <span :class="rootClass" role="status">
        <svg class="rp-spinner__circle" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" opacity="0.2" />
            <path
                d="M12 2a10 10 0 0 1 10 10"
                stroke="currentColor"
                stroke-width="3"
                stroke-linecap="round"
            />
        </svg>
        <span class="rp-spinner__sr">Loading…</span>
    </span>
</template>

<script lang="ts" setup vapor>
import { computed } from 'vue';
import { bem } from '@/utils/bem';
import type { SpinnerProps } from './types';

defineOptions({ name: 'RpSpinner' });

const props = withDefaults(defineProps<SpinnerProps>(), {
    size: 'md',
    color: 'primary',
});

const rootClass = computed(() =>
    bem('rp-spinner', props.size, props.color),
);
</script>

<style lang="scss" scoped>
.rp-spinner {
    @include flex-center;
    line-height: 1;

    @each $name in primary, secondary, success, warning, danger {
        &--#{$name} { color: var(--rp-color-#{$name}); }
    }

    &--current {
        color: currentColor;
    }

    // ── Sizes ──
    &--sm { --_spinner-size: 16px; }
    &--md { --_spinner-size: 24px; }
    &--lg { --_spinner-size: 36px; }

    &__circle {
        width: var(--_spinner-size);
        height: var(--_spinner-size);
        animation: rp-spin 750ms linear infinite;
    }

    &__sr {
        @include visually-hidden;
    }
}

@keyframes rp-spin {
    to { transform: rotate(360deg); }
}
</style>
