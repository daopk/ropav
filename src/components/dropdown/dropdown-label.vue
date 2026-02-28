<template>
    <div class="rp-dropdown__label">
        <slot />
    </div>
</template>

<script lang="ts" setup vapor>
defineOptions({ name: 'RpDropdownLabel' });
</script>

<style lang="scss" scoped>
.rp-dropdown__label {
    padding: var(--_dd-py) var(--_dd-px);
    font-size: var(--_dd-font);
    font-weight: var(--rp-font-weight-semibold);
    color: var(--rp-color-text-secondary);
    line-height: 1.4;
    user-select: none;
}
</style>
