<template>
    <div class="rp-dropdown__separator" role="separator" />
</template>

<script lang="ts" setup vapor>
defineOptions({ name: 'RpDropdownSeparator' });
</script>

<style lang="scss" scoped>
.rp-dropdown__separator {
    height: 1px;
    margin: var(--rp-spacing-1) 0;
    background-color: var(--rp-color-border);
}
</style>
