<template>
    <div v-bind="$attrs"><slot /></div>
</template>

<script lang="ts" setup vapor>
defineOptions({
    name: 'DialogVaporForwardingElement',
    inheritAttrs: false,
});

defineSlots<{
    default?(): unknown;
}>();
</script>
