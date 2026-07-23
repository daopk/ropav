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
            :data-disabled="toPresenceAttribute(control.disabled)"
            :data-invalid="toPresenceAttribute(control.invalid)"
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
            <ScrollArea
                v-if="isOpen"
                v-bind="getPartAttrs('content', { class: 'rp-select__dropdown' })"
                :id="popupId"
                embedded
                type="auto"
                scrollbars="y"
                :viewport-attrs="{ role: 'listbox', tabindex: -1 }"
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
                    :aria-selected="option.value === selectedValue"
                    :aria-disabled="option.disabled || undefined"
                    :data-selected="toPresenceAttribute(option.value === selectedValue)"
                    :data-highlighted="toPresenceAttribute(index === focusedIndex)"
                    :data-disabled="toPresenceAttribute(option.disabled)"
                    v-bind="
                        getPartAttrs('option', {
                            class: [
                                'rp-select__option',
                                {
                                    'rp-select__option--selected': option.value === selectedValue,
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
            </ScrollArea>
        </Transition>
    </div>
</template>

<script lang="ts" setup vapor>
import { computed, ref } from 'vue';
import ChevronsUpDownIcon from '~icons/lucide/chevrons-up-down';
import XIcon from '~icons/lucide/x';
import { useStylesApi } from '@/styles-api';
import { toPresenceAttribute } from '@/utils/attributes';
import ScrollArea from '../scroll-area/scroll-area.vue';
import { useSelect } from './useSelect';
import { useSelectNativeControl } from './useSelectNativeControl';
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

const triggerRef = ref<HTMLElement | null>(null);
const { nativeSelectRef, selectedValue, nativeInputAttrs, requestValueUpdate } =
    useSelectNativeControl(props, (value) => emit('update:modelValue', value), triggerRef);

const {
    selectRef,
    isOpen,
    selectId,
    popupId,
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
    onFocusout,
    onTriggerKeydown,
} = useSelect(props, requestValueUpdate, () => selectedValue.value, triggerRef);

void selectRef;

const { getPartAttrs, getRootAttrs } = useStylesApi<SelectPart>(props, 'root');
const rootAttrs = computed(() =>
    getRootAttrs({
        class: rootClass.value,
        onFocusout,
        'data-state': isOpen.value ? 'open' : 'closed',
        'data-disabled': toPresenceAttribute(control.disabled),
        'data-invalid': toPresenceAttribute(control.invalid),
    }),
);

defineExpose({ nativeElement: nativeSelectRef, focus: () => triggerRef.value?.focus() });
</script>

<style src="./select.scss" lang="scss" scoped></style>
