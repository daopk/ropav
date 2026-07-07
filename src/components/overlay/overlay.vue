<template>
    <div v-if="!disabled" :class="rootClass" :style="rootStyle" aria-hidden="true" />
</template>

<script lang="ts" setup vapor>
import { computed, type CSSProperties } from 'vue';
import { bem } from '@/utils/bem';
import type { OverlayProps } from './types';

defineOptions({ name: 'RpOverlay' });

const props = withDefaults(defineProps<OverlayProps>(), {
    color: 'var(--rp-color-overlay)',
    opacity: 1,
    gradient: '',
    zIndex: 1,
    interactive: false,
    disabled: false,
});

const hasGradient = computed(() => Boolean(props.gradient));

const normalizedOpacity = computed(() => {
    if (!Number.isFinite(props.opacity)) return 1;

    return Math.min(1, Math.max(0, props.opacity));
});

const rootClass = computed(() =>
    bem('rp-overlay', {
        gradient: hasGradient.value,
        interactive: props.interactive,
    }),
);

const rootStyle = computed<CSSProperties>(() => {
    if (hasGradient.value) {
        return {
            '--_rp-overlay-z-index': props.zIndex,
            backgroundImage: props.gradient,
        };
    }

    return {
        '--_rp-overlay-color': props.color,
        '--_rp-overlay-opacity': normalizedOpacity.value,
        '--_rp-overlay-z-index': props.zIndex,
    };
});
</script>

<style src="./overlay.scss" lang="scss" scoped></style>
