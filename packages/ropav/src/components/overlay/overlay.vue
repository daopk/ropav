<template>
    <div v-if="isRendered" v-bind="rootAttrs" />
</template>

<script lang="ts" setup vapor>
import { computed } from 'vue';
import { useStylesApi } from '@/styles-api';
import { useOverlay } from './useOverlay';
import type { OverlayPart, OverlayProps } from './types';

defineOptions({ name: 'RpOverlay', inheritAttrs: false });

const props = withDefaults(defineProps<OverlayProps>(), {
    color: 'rgba(0, 0, 0, 0.55)',
    opacity: 1,
    gradient: '',
    zIndex: 1,
    interactive: false,
    disabled: false,
});

const { isRendered, rootClass, rootStyle } = useOverlay(props);
const { getRootAttrs } = useStylesApi<OverlayPart>(props, 'root');
const rootAttrs = computed(() =>
    getRootAttrs({ class: rootClass.value, style: rootStyle.value, 'aria-hidden': 'true' }),
);
</script>

<style src="./overlay.scss" lang="scss" scoped></style>
