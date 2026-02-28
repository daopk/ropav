<template>
    <div
        :class="rootClass"
        role="menuitemradio"
        :aria-checked="isSelected"
        :tabindex="disabled ? -1 : 0"
        :aria-disabled="disabled || undefined"
        @click="onSelect"
        @keydown.enter.prevent="onSelect"
        @keydown.space.prevent="onSelect"
    >
        <span class="rp-dropdown__radio-indicator">
            <span v-if="isSelected" class="rp-dropdown__radio-dot" />
        </span>
        <span class="rp-dropdown__item-label">
            <slot />
        </span>
    </div>
</template>

<script lang="ts" setup vapor>
import { computed, inject } from 'vue';
import { dropdownRadioGroupKey } from './types';
import type { DropdownRadioItemProps } from './types';

defineOptions({ name: 'RpDropdownRadioItem' });

const props = withDefaults(defineProps<DropdownRadioItemProps>(), {
    disabled: false,
});

const radioGroup = inject(dropdownRadioGroupKey)!;

const isSelected = computed(() => radioGroup.modelValue === props.value);

const rootClass = computed(() => [
    'rp-dropdown__item',
    'rp-dropdown__item--radio',
    props.disabled && 'rp-dropdown__item--disabled',
]);

function onSelect() {
    if (props.disabled) return;
    radioGroup.select(props.value);
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

.rp-dropdown__radio-indicator {
    @include flex-center;
    width: 1em;
    height: 1em;
    flex-shrink: 0;
}

.rp-dropdown__radio-dot {
    width: 0.5em;
    height: 0.5em;
    border-radius: var(--rp-radius-full);
    background-color: var(--rp-color-primary);
}
</style>
