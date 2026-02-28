<template>
    <div
        class="rp-dropdown__item rp-dropdown__sub-trigger"
        role="menuitem"
        tabindex="0"
        aria-haspopup="true"
        :aria-expanded="sub.isOpen"
        @click="sub.openImmediate()"
        @keydown.right.prevent="sub.openImmediate()"
        @keydown.enter.prevent="sub.openImmediate()"
        @keydown.space.prevent="sub.openImmediate()"
    >
        <span v-if="$slots.icon" class="rp-dropdown__item-icon">
            <slot name="icon" />
        </span>
        <span class="rp-dropdown__item-label">
            <slot />
        </span>
        <span class="rp-dropdown__sub-arrow">
            <ChevronRightIcon />
        </span>
    </div>
</template>

<script lang="ts" setup vapor>
import { inject } from 'vue';
import { ChevronRightIcon } from '@/components/_internal/icons';
import { dropdownSubKey } from './types';

defineOptions({ name: 'RpDropdownSubTrigger' });

const sub = inject(dropdownSubKey)!;
</script>

<style lang="scss" scoped>
.rp-dropdown__item {
    display: flex;
    align-items: center;
    gap: var(--rp-spacing-2);
    padding: var(--_dd-py) var(--_dd-px);
    font-size: var(--_dd-font);
    color: var(--rp-color-text);
    cursor: pointer;
    outline: none;
    transition: background-color var(--rp-transition-fast);

    &:hover,
    &:focus-visible {
        background-color: var(--rp-color-gray-100);
    }

    &-icon {
        display: inline-flex;
        align-items: center;
        width: 1em;
        height: 1em;
        flex-shrink: 0;

        svg {
            width: 100%;
            height: 100%;
        }
    }

    &-label {
        flex: 1;
        line-height: 1.4;
    }
}

.rp-dropdown__sub-arrow {
    display: inline-flex;
    align-items: center;
    width: 1em;
    height: 1em;
    flex-shrink: 0;
    margin-left: auto;
    color: var(--rp-color-text-secondary);

    svg {
        width: 100%;
        height: 100%;
    }
}
</style>
