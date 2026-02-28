<template>
    <div
        :class="rootClass"
        role="menuitem"
        :tabindex="disabled ? -1 : 0"
        :aria-disabled="disabled || undefined"
        @click="onSelect"
        @keydown.enter.prevent="onSelect"
        @keydown.space.prevent="onSelect"
    >
        <span v-if="$slots.icon" class="rp-dropdown__item-icon">
            <slot name="icon" />
        </span>
        <span class="rp-dropdown__item-label">
            <slot />
        </span>
        <span v-if="shortcut" class="rp-dropdown__item-shortcut">{{ shortcut }}</span>
    </div>
</template>

<script lang="ts" setup vapor>
import { computed } from 'vue';
import { useRequiredInject } from '@/composables/useRequiredInject';
import { dropdownKey } from './types';
import type { DropdownItemProps } from './types';

defineOptions({ name: 'RpDropdownItem' });

const props = withDefaults(defineProps<DropdownItemProps>(), {
    disabled: false,
    destructive: false,
});

const emit = defineEmits<{
    select: [];
}>();

const dropdown = useRequiredInject(dropdownKey, 'RpDropdownItem');

const rootClass = computed(() => [
    'rp-dropdown__item',
    props.disabled && 'rp-dropdown__item--disabled',
    props.destructive && 'rp-dropdown__item--destructive',
]);

function onSelect() {
    if (props.disabled) return;
    emit('select');
    dropdown.close();
}
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
    transition:
        background-color var(--rp-transition-fast),
        color var(--rp-transition-fast);

    &:hover,
    &:focus-visible {
        background-color: var(--rp-color-gray-100);
    }

    &--disabled {
        color: var(--rp-color-text-disabled);
        cursor: not-allowed;

        &:hover,
        &:focus-visible {
            background-color: transparent;
        }
    }

    &--destructive {
        color: var(--rp-color-danger);

        &:hover,
        &:focus-visible {
            background-color: color-mix(in srgb, var(--rp-color-danger) 8%, transparent);
        }
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

    &-shortcut {
        margin-left: auto;
        padding-left: var(--rp-spacing-4);
        font-size: var(--rp-font-size-xs);
        color: var(--rp-color-text-secondary);
    }
}
</style>
