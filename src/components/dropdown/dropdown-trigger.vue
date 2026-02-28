<template>
    <div class="rp-dropdown__trigger" @click="dropdown.toggle()" @keydown="onKeydown">
        <slot />
    </div>
</template>

<script lang="ts" setup vapor>
import { useRequiredInject } from '@/composables/useRequiredInject';
import { dropdownKey } from './types';

defineOptions({ name: 'RpDropdownTrigger' });

const dropdown = useRequiredInject(dropdownKey, 'RpDropdownTrigger');

function onKeydown(e: KeyboardEvent) {
    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        dropdown.open();
    }
}
</script>

<style lang="scss" scoped>
.rp-dropdown__trigger {
    display: inline-flex;
}
</style>
