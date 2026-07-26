<template>
    <slot />
</template>

<script lang="ts" setup vapor>
import { provideOverlayZIndex } from './useOverlayZIndex';
import type { OverlayLayerProviderProps } from './types';

defineOptions({ name: 'RpOverlayLayerProvider' });

const props = defineProps<OverlayLayerProviderProps>();

provideOverlayZIndex(() => props.baseZIndex);
</script>
