<template>
    <div v-if="isRendered" :class="rootClass" :style="rootStyle" aria-hidden="true" />
</template>

<script lang="ts" setup vapor>
import { useOverlay } from './useOverlay';
import type { OverlayProps } from './types';

defineOptions({ name: 'RpOverlay' });

const props = withDefaults(defineProps<OverlayProps>(), {
    color: 'rgba(0, 0, 0, 0.55)',
    opacity: 1,
    gradient: '',
    zIndex: 1,
    interactive: false,
    disabled: false,
});

const { isRendered, rootClass, rootStyle } = useOverlay(props);
</script>

<style src="./overlay.scss" lang="scss" scoped></style>
