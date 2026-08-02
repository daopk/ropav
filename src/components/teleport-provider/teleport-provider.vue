<template>
    <slot />
</template>

<script lang="ts" setup vapor>
import type { TeleportProviderProps } from './types';
import { provideTeleportTarget } from './useTeleportTarget';

defineOptions({ name: 'RpTeleportProvider' });

const props = defineProps<TeleportProviderProps>();

provideTeleportTarget(props);
</script>
