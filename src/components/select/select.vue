<template>
    <div v-bind="rootAttrs" ref="selectRef">
        <select
            v-bind="nativeInputAttrs"
            ref="nativeSelectRef"
            :name="name"
            :form="control.form ?? nativeInputAttrs.form"
            :disabled="control.disabled || undefined"
            :required="control.required || undefined"
            tabindex="-1"
            aria-hidden="true"
        >
            <option value="" />
            <option
                v-for="option in visibleOptions"
                :key="option.value"
                :value="String(option.value)"
                :disabled="option.disabled || undefined"
            >
                {{ option.label }}
            </option>
        </select>
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
                    :aria-selected="option.value === controllable.value.value"
                    :aria-disabled="option.disabled || undefined"
                    :data-selected="presence(option.value === controllable.value.value)"
                    :data-highlighted="presence(index === focusedIndex)"
                    :data-disabled="presence(option.disabled)"
                    v-bind="
                        getPartAttrs('option', {
                            class: [
                                'rp-select__option',
                                {
                                    'rp-select__option--selected':
                                        option.value === controllable.value.value,
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
import { computed, ref, watchEffect, type SelectHTMLAttributes } from 'vue';
import ChevronsUpDownIcon from '~icons/lucide/chevrons-up-down';
import XIcon from '~icons/lucide/x';
import { useControllableValue } from '@/composables/useControllableValue';
import { useFormControl } from '@/composables/useFormControl';
import { presence, useStylesApi } from '@/styles-api';
import { useSelect } from './useSelect';
import type { SelectPart, SelectProps } from './types';

defineOptions({ name: 'RpSelect', inheritAttrs: false });

const props = withDefaults(defineProps<SelectProps>(), {
    modelValue: undefined,
    defaultValue: null,
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

const nativeSelectRef = ref<HTMLSelectElement | null>(null);
const controllable = useControllableValue<string | number | null>({
    modelValue: () => props.modelValue,
    defaultValue: () => props.defaultValue,
    onChange: (value) => emit('update:modelValue', value),
});

function getNativeValue(select: HTMLSelectElement) {
    if (select.selectedIndex <= 0) return null;
    return props.options?.[select.selectedIndex - 1]?.value ?? null;
}

function syncNativeSelection(value: string | number | null) {
    const select = nativeSelectRef.value;
    if (!select) return;

    const optionIndex = props.options?.findIndex((option) => option.value === value) ?? -1;
    select.selectedIndex = optionIndex + 1;
}

function syncNativeDefaultSelection() {
    const select = nativeSelectRef.value;
    if (!select) return;

    const optionIndex =
        props.options?.findIndex((option) => option.value === controllable.initialValue) ?? -1;
    for (const [index, option] of [...select.options].entries()) {
        option.defaultSelected = index === optionIndex + 1;
    }
}

function requestValueUpdate(value: string | number | null) {
    const select = nativeSelectRef.value;
    if (!select) {
        controllable.setValue(value);
        return;
    }

    syncNativeSelection(value);
    select.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
    select.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));

    if (controllable.isControlled.value) {
        queueMicrotask(() => syncNativeSelection(controllable.value.value));
    }
}

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
} = useSelect(props, requestValueUpdate, () => controllable.value.value);

useFormControl({
    elements: () => [nativeSelectRef.value],
    isControlled: () => controllable.isControlled.value,
    validationMessage: () => props.validationMessage,
    readResetValue(elements) {
        controllable.resetValue(getNativeValue(elements[0] as HTMLSelectElement));
    },
    syncControlledValue() {
        syncNativeSelection(controllable.value.value);
    },
});

watchEffect(syncNativeDefaultSelection, { flush: 'post' });
watchEffect(() => syncNativeSelection(controllable.value.value), { flush: 'post' });

const nativeInputAttrs = computed<SelectHTMLAttributes>(() => {
    const {
        class: compatibilityClass,
        style: compatibilityStyle,
        onInput: compatibilityOnInput,
        onChange: compatibilityOnChange,
        onInvalid: compatibilityOnInvalid,
        ...attrs
    } = props.inputAttrs ?? {};

    return {
        ...attrs,
        class: ['rp-select__native', compatibilityClass],
        style: compatibilityStyle,
        onInput(event) {
            controllable.setValue(getNativeValue(event.currentTarget as HTMLSelectElement));
            compatibilityOnInput?.(event);
        },
        onChange(event) {
            compatibilityOnChange?.(event);
        },
        onInvalid(event) {
            event.preventDefault();
            triggerRef.value?.focus();
            compatibilityOnInvalid?.(event);
        },
    };
});

void selectRef;

const { getPartAttrs, getRootAttrs } = useStylesApi<SelectPart>(props, 'root');
const rootAttrs = computed(() =>
    getRootAttrs({
        class: rootClass.value,
        'data-state': isOpen.value ? 'open' : 'closed',
        'data-disabled': presence(control.disabled),
        'data-invalid': presence(control.invalid),
    }),
);

defineExpose({ nativeElement: nativeSelectRef, focus: () => triggerRef.value?.focus() });
</script>

<style src="./select.scss" lang="scss" scoped></style>
