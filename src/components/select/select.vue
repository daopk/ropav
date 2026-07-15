<template>
    <div v-bind="rootAttrs" ref="selectRef">
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
            v-bind="getPartAttrs('trigger', { class: 'rp-select__trigger' })"
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
            :data-disabled="presence(control.disabled)"
            :data-invalid="presence(control.invalid)"
            :tabindex="control.disabled ? -1 : 0"
            @click="toggle"
            @keydown="onTriggerKeydown"
        >
            <span
                v-bind="
                    getPartAttrs('value', {
                        class: ['rp-select__value', { 'rp-select__placeholder': !hasValue }],
                    })
                "
            >
                {{ displayLabel || placeholder }}
            </span>

            <span v-bind="getPartAttrs('indicator', { class: 'rp-select__indicator' })">
                <button
                    v-if="canClear"
                    type="button"
                    v-bind="getPartAttrs('clear', { class: 'rp-select__clear' })"
                    :aria-label="clearLabel"
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
            <div
                v-if="isOpen"
                v-bind="getPartAttrs('content', { class: 'rp-select__dropdown' })"
                role="listbox"
                :id="listboxId"
                :data-state="isOpen ? 'open' : 'closed'"
            >
                <div
                    v-if="visibleOptions.length === 0"
                    v-bind="getPartAttrs('empty', { class: 'rp-select__empty' })"
                >
                    <slot name="empty">No options</slot>
                </div>
                <div
                    v-for="(option, index) in visibleOptions"
                    :key="option.value"
                    role="option"
                    :id="`${selectId}-option-${index}`"
                    :aria-selected="option.value === modelValue"
                    :aria-disabled="option.disabled || undefined"
                    :data-selected="presence(option.value === modelValue)"
                    :data-highlighted="presence(index === focusedIndex)"
                    :data-disabled="presence(option.disabled)"
                    v-bind="
                        getPartAttrs('option', {
                            class: [
                                'rp-select__option',
                                {
                                    'rp-select__option--selected': option.value === modelValue,
                                    'rp-select__option--focused': index === focusedIndex,
                                    'rp-select__option--disabled': option.disabled,
                                },
                            ],
                        })
                    "
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
import { computed } from 'vue';
import ChevronsUpDownIcon from '~icons/lucide/chevrons-up-down';
import XIcon from '~icons/lucide/x';
import { presence, useStylesApi } from '@/styles-api';
import { useSelect } from './useSelect';
import type { SelectPart, SelectProps } from './types';

defineOptions({ name: 'RpSelect', inheritAttrs: false });

const props = withDefaults(defineProps<SelectProps>(), {
    options: () => [],
    placeholder: 'Select...',
    clearable: false,
    clearLabel: 'Clear selection',
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

const { getPartAttrs, getRootAttrs } = useStylesApi<SelectPart>(props, 'root');
const rootAttrs = computed(() =>
    getRootAttrs({
        class: rootClass.value,
        'data-state': isOpen.value ? 'open' : 'closed',
        'data-disabled': presence(control.disabled),
        'data-invalid': presence(control.invalid),
    }),
);
</script>

<style src="./select.scss" lang="scss" scoped></style>
