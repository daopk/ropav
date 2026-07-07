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

function getBlurValue(blur: OverlayProps['blur']) {
    if (blur == null || blur === '') return undefined;

    if (typeof blur === 'number') {
        if (!Number.isFinite(blur) || blur < 0) return undefined;

        return `${blur}px`;
    }

    return blur;
}

const normalizedOpacity = computed(() => {
    if (!Number.isFinite(props.opacity)) return 1;

    return Math.min(1, Math.max(0, props.opacity));
});

const blurValue = computed(() => getBlurValue(props.blur));
const hasBlur = computed(() => Boolean(blurValue.value));

const rootClass = computed(() =>
    bem('rp-overlay', {
        gradient: hasGradient.value,
        blurred: hasBlur.value,
        interactive: props.interactive,
    }),
);

const rootStyle = computed<CSSProperties>(() => {
    const style: CSSProperties = {
        '--_rp-overlay-z-index': props.zIndex,
    };

    if (blurValue.value) {
        style['--_rp-overlay-blur'] = blurValue.value;
    }

    if (hasGradient.value) {
        return {
            ...style,
            backgroundImage: props.gradient,
        };
    }

    return {
        ...style,
        '--_rp-overlay-color': props.color,
        '--_rp-overlay-opacity': normalizedOpacity.value,
    };
});
</script>

<style src="./overlay.scss" lang="scss" scoped></style>
