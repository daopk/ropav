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
    zIndex: 1,
    interactive: false,
    disabled: false,
});

const normalizedOpacity = computed(() => {
    if (!Number.isFinite(props.opacity)) return 1;

    return Math.min(1, Math.max(0, props.opacity));
});

const rootClass = computed(() =>
    bem('rp-overlay', {
        interactive: props.interactive,
    }),
);

const rootStyle = computed<CSSProperties>(() => ({
    '--_rp-overlay-color': props.color,
    '--_rp-overlay-opacity': normalizedOpacity.value,
    '--_rp-overlay-z-index': props.zIndex,
}));
</script>

<style src="./overlay.scss" lang="scss" scoped></style>
