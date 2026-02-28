<template>
    <Transition name="rp-dropdown-sub">
        <div v-if="sub.isOpen" class="rp-dropdown__sub-content" role="menu" ref="contentRef" @keydown="onKeydown">
            <slot />
        </div>
    </Transition>
</template>

<script lang="ts" setup vapor>
import { inject, ref, nextTick, watch } from 'vue';
import { dropdownKey, dropdownSubKey } from './types';

defineOptions({ name: 'RpDropdownSubContent' });

const dropdown = inject(dropdownKey)!;
const sub = inject(dropdownSubKey)!;
const contentRef = ref<HTMLElement | null>(null);

const menuItemSelector = '[role="menuitem"]:not([aria-disabled="true"]), [role="menuitemcheckbox"]:not([aria-disabled="true"]), [role="menuitemradio"]:not([aria-disabled="true"])';

function getMenuItems(): HTMLElement[] {
    if (!contentRef.value) return [];
    return Array.from(contentRef.value.querySelectorAll<HTMLElement>(menuItemSelector))
        .filter((el) => el.closest('[role="menu"]') === contentRef.value);
}

function onKeydown(e: KeyboardEvent) {
    const items = getMenuItems();

    switch (e.key) {
        case 'ArrowDown': {
            e.preventDefault();
            e.stopPropagation();
            const activeEl = document.activeElement as HTMLElement;
            const idx = items.indexOf(activeEl);
            const next = idx < items.length - 1 ? idx + 1 : 0;
            items[next]?.focus();
            break;
        }
        case 'ArrowUp': {
            e.preventDefault();
            e.stopPropagation();
            const activeEl = document.activeElement as HTMLElement;
            const idx = items.indexOf(activeEl);
            const prev = idx > 0 ? idx - 1 : items.length - 1;
            items[prev]?.focus();
            break;
        }
        case 'ArrowLeft':
            e.preventDefault();
            e.stopPropagation();
            sub.closeImmediate();
            break;
        case 'Escape':
            e.preventDefault();
            e.stopPropagation();
            sub.closeImmediate();
            dropdown.close();
            break;
    }
}

watch(() => sub.isOpen, (open) => {
    if (open) {
        nextTick(() => {
            const items = getMenuItems();
            items[0]?.focus();
        });
    }
});
</script>

<style lang="scss" scoped>
.rp-dropdown__sub-content {
    position: absolute;
    left: calc(100% + 2px);
    top: calc(-1 * var(--rp-spacing-1));
    z-index: 101;
    min-width: 160px;
    background-color: var(--rp-color-surface);
    border: 1px solid var(--rp-color-border);
    border-radius: var(--rp-radius-lg);
    box-shadow: var(--rp-shadow-md);
    padding: var(--rp-spacing-1) 0;
    font-family: var(--rp-font-family);
}

.rp-dropdown-sub-enter-active,
.rp-dropdown-sub-leave-active {
    transition:
        opacity var(--rp-transition-fast),
        transform var(--rp-transition-fast);
}

.rp-dropdown-sub-enter-from,
.rp-dropdown-sub-leave-to {
    opacity: 0;
    transform: translateX(-4px);
}
</style>
