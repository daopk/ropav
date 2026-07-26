<template>
    <button v-bind="$attrs"><slot /></button>
</template>

<script lang="ts" setup vapor>
defineOptions({
    name: 'DropdownMenuVaporForwardingButton',
    inheritAttrs: false,
});

defineSlots<{
    default?(): unknown;
}>();
</script>
