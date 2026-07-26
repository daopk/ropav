<template>
    <Teleport :to="teleportTo" :disabled="!teleport">
        <slot />
    </Teleport>
</template>

<script lang="ts" setup vapor>
import { provideTeleportTarget } from '../teleport-provider/useTeleportTarget';
import type { DialogPortalProps } from './types';

defineOptions({ name: 'RpDialogPortal' });

const props = withDefaults(defineProps<DialogPortalProps>(), {
    teleport: true,
    teleportTo: undefined,
});

const teleportTo = provideTeleportTarget(props);
</script>
