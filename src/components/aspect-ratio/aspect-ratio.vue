<template>
    <div v-bind="rootAttrs">
        <slot />
    </div>
</template>

<script lang="ts" setup vapor>
import { computed, type CSSProperties } from 'vue';
import { useStylesApi } from '@/styles-api';
import type { AspectRatioPart, AspectRatioProps } from './types';

defineOptions({ name: 'RpAspectRatio', inheritAttrs: false });

const props = withDefaults(defineProps<AspectRatioProps>(), {
    ratio: 1,
});

const rootStyle = computed<CSSProperties>(() => ({
    '--_rp-aspect-ratio': String(normalizeAspectRatio(props.ratio)),
}));

const { getRootAttrs } = useStylesApi<AspectRatioPart>(props, 'root');
const rootAttrs = computed(() =>
    getRootAttrs({ class: 'rp-aspect-ratio', style: rootStyle.value }),
);

function normalizeAspectRatio(ratio: number) {
    return Number.isFinite(ratio) && ratio > 0 ? ratio : 1;
}
</script>

<style src="./aspect-ratio.scss" lang="scss" scoped></style>
