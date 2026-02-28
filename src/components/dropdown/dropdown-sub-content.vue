<template>
    <Transition name="rp-dropdown-sub">
        <div v-if="sub.isOpen" class="rp-dropdown__sub-content" role="menu" ref="contentRef" @keydown="onKeydown">
            <slot />
        </div>
    </Transition>
</template>

<script lang="ts" setup vapor>
import { ref } from 'vue';
import { useMenuKeyboard } from '@/composables/useMenuKeyboard';
import { useRequiredInject } from '@/composables/useRequiredInject';
import { dropdownKey, dropdownSubKey } from './types';

defineOptions({ name: 'RpDropdownSubContent' });

const dropdown = useRequiredInject(dropdownKey, 'RpDropdownSubContent');
const sub = useRequiredInject(dropdownSubKey, 'RpDropdownSubContent');
const contentRef = ref<HTMLElement | null>(null);

const { onKeydown } = useMenuKeyboard({
    contentRef,
    isOpen: () => sub.isOpen,
    stopPropagation: true,
    onArrowLeft: () => {
        sub.closeImmediate();
        sub.triggerEl?.focus();
    },
    onEscape: () => {
        sub.closeImmediate();
        dropdown.close();
    },
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
