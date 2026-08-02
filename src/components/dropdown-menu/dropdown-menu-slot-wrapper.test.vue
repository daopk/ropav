<template>
    <slot />
</template>

<script lang="ts" setup vapor>
defineOptions({ name: 'DropdownMenuVaporSlotWrapper' });

defineSlots<{
    default?(): unknown;
}>();
</script>
