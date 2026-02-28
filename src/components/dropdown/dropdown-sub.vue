<template>
    <div class="rp-dropdown__sub" @mouseenter="onMouseenter" @mouseleave="onMouseleave">
        <slot />
    </div>
</template>

<script lang="ts" setup vapor>
import { provide, ref, onBeforeUnmount } from 'vue';
import { dropdownSubKey } from './types';
import type { DropdownSubContext } from './types';

defineOptions({ name: 'RpDropdownSub' });

const isOpen = ref(false);
let openTimer: ReturnType<typeof setTimeout> | null = null;
let closeTimer: ReturnType<typeof setTimeout> | null = null;

function clearTimers() {
    if (openTimer) { clearTimeout(openTimer); openTimer = null; }
    if (closeTimer) { clearTimeout(closeTimer); closeTimer = null; }
}

function open() {
    if (closeTimer) { clearTimeout(closeTimer); closeTimer = null; }
    openTimer = setTimeout(() => { isOpen.value = true; }, 100);
}

function close() {
    if (openTimer) { clearTimeout(openTimer); openTimer = null; }
    closeTimer = setTimeout(() => { isOpen.value = false; }, 150);
}

function openImmediate() {
    clearTimers();
    isOpen.value = true;
}

function closeImmediate() {
    clearTimers();
    isOpen.value = false;
}

function onMouseenter() { open(); }
function onMouseleave() { close(); }

onBeforeUnmount(clearTimers);

provide<DropdownSubContext>(dropdownSubKey, {
    get isOpen() { return isOpen.value; },
    open,
    close,
    openImmediate,
    closeImmediate,
});
</script>

<style lang="scss" scoped>
.rp-dropdown__sub {
    position: relative;
}
</style>
