<template>
    <div
        :class="rootClass"
        role="menuitemcheckbox"
        :aria-checked="modelValue"
        :tabindex="disabled ? -1 : 0"
        :aria-disabled="disabled || undefined"
        @click="onToggle"
        @keydown.enter.prevent="onToggle"
        @keydown.space.prevent="onToggle"
    >
        <span class="rp-dropdown__check-indicator">
            <CheckIcon v-if="modelValue" />
        </span>
        <span class="rp-dropdown__item-label">
            <slot />
        </span>
    </div>
</template>

<script lang="ts" setup vapor>
import { computed } from 'vue';
import { CheckIcon } from '@/components/_internal/icons';
import type { DropdownCheckboxItemProps } from './types';

defineOptions({ name: 'RpDropdownCheckboxItem' });

const props = withDefaults(defineProps<DropdownCheckboxItemProps>(), {
    modelValue: false,
    disabled: false,
});

const emit = defineEmits<{
    'update:modelValue': [value: boolean];
}>();

const rootClass = computed(() => [
    'rp-dropdown__item',
    'rp-dropdown__item--check',
    props.disabled && 'rp-dropdown__item--disabled',
]);

function onToggle() {
    if (props.disabled) return;
    emit('update:modelValue', !props.modelValue);
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
    transition: background-color var(--rp-transition-fast);

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

    &-label {
        flex: 1;
        line-height: 1.4;
    }
}

.rp-dropdown__check-indicator {
    @include flex-center;
    width: 1em;
    height: 1em;
    flex-shrink: 0;
    color: var(--rp-color-primary);

    svg {
        width: 100%;
        height: 100%;
    }
}
</style>
