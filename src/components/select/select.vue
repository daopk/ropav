<template>
    <div :class="rootClass" ref="selectRef">
        <input
            v-if="name"
            type="hidden"
            :name="name"
            :value="modelValue ?? ''"
            :disabled="control.disabled || undefined"
        />
        <div
            :id="control.id"
            ref="triggerRef"
            class="rp-select__trigger"
            role="combobox"
            :aria-expanded="isOpen"
            aria-haspopup="listbox"
            :aria-activedescendant="activeDescendantId"
            :aria-controls="listboxId"
            :aria-disabled="control.disabled || undefined"
            :aria-invalid="control.invalid || undefined"
            :aria-required="control.required || undefined"
            :aria-label="ariaLabel || undefined"
            :aria-labelledby="control.ariaLabelledby"
            :aria-describedby="control.ariaDescribedby"
            :data-state="isOpen ? 'open' : 'closed'"
            :data-disabled="control.disabled || undefined"
            :tabindex="control.disabled ? -1 : 0"
            @click="toggle"
            @keydown="onTriggerKeydown"
        >
            <span class="rp-select__value" :class="{ 'rp-select__placeholder': !hasValue }">
                {{ displayLabel || placeholder }}
            </span>

            <span class="rp-select__indicator">
                <button
                    v-if="canClear"
                    type="button"
                    class="rp-select__clear"
                    aria-label="Clear selection"
                    tabindex="-1"
                    @mousedown.prevent
                    @click.stop="clearSelection"
                >
                    <XIcon />
                </button>
                <span class="rp-select__arrow" aria-hidden="true">
                    <ChevronsUpDownIcon />
                </span>
            </span>
        </div>

        <Transition name="rp-select-dropdown">
            <div v-if="isOpen" class="rp-select__dropdown" role="listbox" :id="listboxId">
                <div v-if="visibleOptions.length === 0" class="rp-select__empty">
                    <slot name="empty">No options</slot>
                </div>
                <div
                    v-for="(option, index) in visibleOptions"
                    :key="option.value"
                    role="option"
                    :id="`${selectId}-option-${index}`"
                    :aria-selected="option.value === modelValue"
                    :aria-disabled="option.disabled || undefined"
                    :data-selected="option.value === modelValue || undefined"
                    :data-disabled="option.disabled || undefined"
                    :class="[
                        'rp-select__option',
                        {
                            'rp-select__option--selected': option.value === modelValue,
                            'rp-select__option--focused': index === focusedIndex,
                            'rp-select__option--disabled': option.disabled,
                        },
                    ]"
                    @click="selectOption(option)"
                    @mouseenter="onOptionMouseenter(option, index)"
                >
                    {{ option.label }}
                </div>
            </div>
        </Transition>
    </div>
</template>

<script lang="ts" setup vapor>
import ChevronsUpDownIcon from '~icons/lucide/chevrons-up-down';
import XIcon from '~icons/lucide/x';
import { useSelect } from './useSelect';
import type { SelectProps } from './types';

defineOptions({ name: 'RpSelect' });

const props = withDefaults(defineProps<SelectProps>(), {
    options: () => [],
    placeholder: 'Select...',
    clearable: false,
    disabled: undefined,
    required: undefined,
    invalid: undefined,
});

const emit = defineEmits<{
    'update:modelValue': [value: string | number | null];
}>();

const {
    selectRef,
    triggerRef,
    isOpen,
    selectId,
    listboxId,
    control,
    visibleOptions,
    focusedIndex,
    activeDescendantId,
    rootClass,
    hasValue,
    displayLabel,
    canClear,
    toggle,
    selectOption,
    clearSelection,
    onOptionMouseenter,
    onTriggerKeydown,
} = useSelect(props, (value) => {
    emit('update:modelValue', value);
});

void selectRef;
void triggerRef;
</script>

<style src="./select.scss" lang="scss" scoped></style>
