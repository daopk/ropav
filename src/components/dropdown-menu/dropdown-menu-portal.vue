<template>
    <Teleport :to="teleportTo" :disabled="disabled || !teleport">
        <slot />
    </Teleport>
</template>

<script lang="ts" setup vapor>
import { provideTeleportTarget } from '../teleport-provider/useTeleportTarget';
import type { DropdownMenuPortalPrimitiveProps } from './types';

defineOptions({ name: 'RpDropdownMenuPortal' });

const props = withDefaults(defineProps<DropdownMenuPortalPrimitiveProps>(), {
    to: undefined,
    teleportTo: undefined,
    teleport: true,
    disabled: false,
});

const teleportTo = provideTeleportTarget(
    {
        get teleportTo() {
            return props.to ?? props.teleportTo;
        },
    },
    () => Boolean(props.teleport && !props.disabled),
);
</script>
