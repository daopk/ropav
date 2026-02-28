<template>
    <div class="rp-dropdown" ref="rootRef">
        <slot />
    </div>
</template>

<script lang="ts" setup vapor>
import { provide, ref } from 'vue';
import { useClickOutside } from '@/composables/useClickOutside';
import { dropdownKey } from './types';
import type { DropdownProps, DropdownContext } from './types';

defineOptions({ name: 'RpDropdown' });

const props = withDefaults(defineProps<DropdownProps>(), {
    size: 'md',
});

const rootRef = ref<HTMLElement | null>(null);
const isOpen = ref(false);

function open() { isOpen.value = true; }
function close() { isOpen.value = false; }
function toggle() { isOpen.value = !isOpen.value; }

useClickOutside(rootRef, isOpen, close);

provide<DropdownContext>(dropdownKey, {
    get isOpen() { return isOpen.value; },
    get size() { return props.size; },
    open,
    close,
    toggle,
});
</script>

<style lang="scss" scoped>
.rp-dropdown {
    position: relative;
    display: inline-flex;
}
</style>
