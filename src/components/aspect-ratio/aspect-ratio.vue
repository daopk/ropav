<template>
    <div class="rp-aspect-ratio" :style="rootStyle">
        <slot />
    </div>
</template>

<script lang="ts" setup vapor>
import { computed, type CSSProperties } from 'vue';
import type { AspectRatioProps } from './types';

defineOptions({ name: 'RpAspectRatio' });

const props = withDefaults(defineProps<AspectRatioProps>(), {
    ratio: 1,
});

const rootStyle = computed<CSSProperties>(() => ({
    '--_rp-aspect-ratio': String(normalizeAspectRatio(props.ratio)),
}));

function normalizeAspectRatio(ratio: number) {
    return Number.isFinite(ratio) && ratio > 0 ? ratio : 1;
}
</script>

<style src="./aspect-ratio.scss" lang="scss" scoped></style>
