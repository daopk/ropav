<template>
    <Transition name="rp-dropdown-content">
        <div v-if="dropdown.isOpen" :class="rootClass" role="menu" ref="contentRef" @keydown="onKeydown">
            <slot />
        </div>
    </Transition>
</template>

<script lang="ts" setup vapor>
import { computed, ref } from 'vue';
import { useMenuKeyboard } from '@/composables/useMenuKeyboard';
import { useRequiredInject } from '@/composables/useRequiredInject';
import { dropdownKey } from './types';
import type { DropdownContentProps } from './types';

defineOptions({ name: 'RpDropdownContent' });

const props = withDefaults(defineProps<DropdownContentProps>(), {
    align: 'start',
});

const dropdown = useRequiredInject(dropdownKey, 'RpDropdownContent');
const contentRef = ref<HTMLElement | null>(null);

const rootClass = computed(() => [
    'rp-dropdown__content',
    `rp-dropdown__content--${props.align}`,
    `rp-dropdown__content--${dropdown.size}`,
]);

const { onKeydown } = useMenuKeyboard({
    contentRef,
    isOpen: () => dropdown.isOpen,
    onEscape: () => dropdown.close(),
});
</script>

<style lang="scss" scoped>
.rp-dropdown__content {
    position: absolute;
    top: calc(100% + var(--rp-spacing-1));
    z-index: 100;
    min-width: 180px;
    background-color: var(--rp-color-surface);
    border: 1px solid var(--rp-color-border);
    border-radius: var(--rp-radius-lg);
    box-shadow: var(--rp-shadow-md);
    padding: var(--rp-spacing-1) 0;
    font-family: var(--rp-font-family);

    &--start { left: 0; }
    &--end { right: 0; }

    &--sm { --_dd-font: var(--rp-font-size-xs); --_dd-py: var(--rp-spacing-1); --_dd-px: var(--rp-spacing-3); }
    &--md { --_dd-font: var(--rp-font-size-sm); --_dd-py: 6px;                 --_dd-px: var(--rp-spacing-3); }
    &--lg { --_dd-font: var(--rp-font-size-base); --_dd-py: var(--rp-spacing-2); --_dd-px: var(--rp-spacing-4); }
}

.rp-dropdown-content-enter-active,
.rp-dropdown-content-leave-active {
    transition:
        opacity var(--rp-transition-fast),
        transform var(--rp-transition-fast);
}

.rp-dropdown-content-enter-from,
.rp-dropdown-content-leave-to {
    opacity: 0;
    transform: translateY(-4px);
}
</style>
