<template>
    <span :class="rootClass" :style="rootStyle" />
</template>

<script lang="ts" setup vapor>
import { computed } from 'vue';
import { bem } from '@/utils/bem';
import type { SkeletonProps } from './types';

defineOptions({ name: 'RpSkeleton' });

const props = withDefaults(defineProps<SkeletonProps>(), {
    variant: 'text',
    animate: true,
});

const rootClass = computed(() =>
    bem('rp-skeleton', props.variant, { animate: props.animate }),
);

const rootStyle = computed(() => {
    const style: Record<string, string> = {};
    if (props.width) style.width = props.width;
    if (props.height) style.height = props.height;
    return style;
});
</script>

<style lang="scss" scoped>
.rp-skeleton {
    display: block;
    background-color: var(--rp-color-gray-200);

    &--text {
        height: 1em;
        border-radius: var(--rp-radius-base);
        width: 100%;
    }

    &--circular {
        width: 40px;
        height: 40px;
        border-radius: var(--rp-radius-full);
    }

    &--rectangular {
        width: 100%;
        height: 120px;
        border-radius: var(--rp-radius-md);
    }

    &--animate {
        background: linear-gradient(
            90deg,
            var(--rp-color-gray-200) 25%,
            var(--rp-color-gray-100) 50%,
            var(--rp-color-gray-200) 75%
        );
        background-size: 200% 100%;
        animation: rp-skeleton-shimmer 1.5s ease-in-out infinite;
    }
}

@keyframes rp-skeleton-shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
}
</style>
