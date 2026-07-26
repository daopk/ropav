<template>
    <div v-bind="rootAttrs" :ref="templateRefs.root">
        <select
            v-bind="nativeSelectAttrs"
            :ref="templateRefs.native"
            :name="name"
            :form="control.form"
            :disabled="control.disabled || undefined"
            :required="control.required || undefined"
            multiple
            tabindex="-1"
            aria-hidden="true"
        >
            <option
                v-for="option in options"
                :key="option.value"
                :value="String(option.value)"
                :disabled="option.disabled || undefined"
            >
                {{ option.label }}
            </option>
        </select>

        <div v-bind="getPartAttrs('pills', { class: 'rp-multi-select__pills' })">
            <span
                v-for="option in selectedOptions"
                :key="option.value"
                v-bind="getPartAttrs('pill', { class: 'rp-multi-select__pill' })"
            >
                <span
                    v-bind="
                        getPartAttrs('pillLabel', {
                            class: 'rp-multi-select__pill-label',
                        })
                    "
                >
                    <slot name="pill" :option="option">{{ option.label }}</slot>
                </span>
                <button
                    type="button"
                    v-bind="
                        getPartAttrs('pillRemove', {
                            class: 'rp-multi-select__pill-remove',
                        })
                    "
                    :aria-label="`${removeLabel} ${option.label}`"
                    :disabled="control.disabled || undefined"
                    tabindex="-1"
                    @mousedown.prevent
                    @click.stop="removeOption(option)"
                >
                    <XIcon />
                </button>
            </span>

            <input v-bind="visibleInputAttrs" :ref="templateRefs.input" />
        </div>

        <span v-bind="getPartAttrs('indicator', { class: 'rp-multi-select__indicator' })">
            <button
                v-if="canClear"
                type="button"
                v-bind="getPartAttrs('clear', { class: 'rp-multi-select__clear' })"
                :aria-label="clearLabel"
                tabindex="-1"
                @mousedown.prevent
                @click.stop="clearSelection"
            >
                <XIcon />
            </button>
            <button
                type="button"
                v-bind="getPartAttrs('toggle', { class: 'rp-multi-select__toggle' })"
                :aria-label="toggleLabel"
                :aria-expanded="isOpen"
                :disabled="control.disabled || undefined"
                tabindex="-1"
                @mousedown.prevent
                @click.stop="toggle"
            >
                <ChevronsUpDownIcon />
            </button>
        </span>

        <Transition name="rp-multi-select-dropdown">
            <ScrollArea
                v-if="isOpen"
                :ref="setDropdownElement"
                v-bind="contentAttrs"
                :id="popupId"
                embedded
                type="auto"
                scrollbars="y"
                :viewport-attrs="listboxAttrs"
                :data-state="isOpen ? 'open' : 'closed'"
            >
                <div
                    v-if="visibleOptions.length === 0"
                    v-bind="getPartAttrs('empty', { class: 'rp-multi-select__empty' })"
                >
                    <slot name="empty" :search-value="searchValue">No options</slot>
                </div>
                <div
                    v-for="optionState in renderedOptions"
                    :key="optionState.option.value"
                    :id="optionState.id"
                    role="option"
                    :aria-selected="optionState.selected"
                    :aria-disabled="optionState.disabled || undefined"
                    :data-selected="toPresenceAttribute(optionState.selected)"
                    :data-highlighted="toPresenceAttribute(optionState.active)"
                    :data-disabled="toPresenceAttribute(optionState.disabled)"
                    v-bind="
                        getPartAttrs('option', {
                            class: [
                                'rp-multi-select__option',
                                {
                                    'rp-multi-select__option--selected': optionState.selected,
                                    'rp-multi-select__option--highlighted': optionState.active,
                                    'rp-multi-select__option--disabled': optionState.disabled,
                                },
                            ],
                        })
                    "
                    @mousedown.prevent
                    @click="selectOption(optionState.option)"
                    @mouseenter="onOptionMouseenter(optionState.option)"
                >
                    <slot
                        name="option"
                        :option="optionState.option"
                        :selected="optionState.selected"
                        :highlighted="optionState.active"
                    >
                        {{ optionState.option.label }}
                    </slot>
                    <CheckIcon v-if="optionState.selected" aria-hidden="true" />
                </div>
            </ScrollArea>
        </Transition>
    </div>
</template>

<script lang="ts" setup vapor>
import { computed, type InputHTMLAttributes } from 'vue';
import CheckIcon from '~icons/lucide/check';
import ChevronsUpDownIcon from '~icons/lucide/chevrons-up-down';
import XIcon from '~icons/lucide/x';
import { useStylesApi } from '@/styles-api';
import { toPresenceAttribute } from '@/utils/attributes';
import { composeEventHandlers, splitCompatibilityAttributes } from '@/utils/dom/attributes';
import ScrollArea from '../scroll-area/scroll-area.vue';
import { useMultiSelect } from './useMultiSelect';
import type {
    MultiSelectEmptySlotProps,
    MultiSelectOptionSlotProps,
    MultiSelectPart,
    MultiSelectPillSlotProps,
    MultiSelectProps,
    MultiSelectValue,
} from './types';

defineOptions({ name: 'RpMultiSelect', inheritAttrs: false });

const props = withDefaults(defineProps<MultiSelectProps>(), {
    modelValue: undefined,
    defaultValue: () => [],
    options: () => [],
    filter: undefined,
    maxValues: undefined,
    placeholder: 'Select...',
    clearable: false,
    clearLabel: 'Clear selection',
    removeLabel: 'Remove',
    toggleLabel: 'Toggle options',
    disabled: undefined,
    required: undefined,
    invalid: undefined,
});

const emit = defineEmits<{
    'update:modelValue': [value: MultiSelectValue[]];
    search: [searchValue: string];
}>();

defineSlots<{
    option?(props: MultiSelectOptionSlotProps): unknown;
    pill?(props: MultiSelectPillSlotProps): unknown;
    empty?(props: MultiSelectEmptySlotProps): unknown;
}>();

const {
    templateRefs,
    nativeSelectAttrs,
    isOpen,
    popupId,
    listboxId,
    control,
    visibleOptions,
    renderedOptions,
    selectedOptions,
    activeDescendantId,
    rootClass,
    floatingStyle,
    actualPlacement,
    placementSide,
    searchValue,
    canClear,
    setDropdownElement,
    toggle,
    selectOption,
    removeOption,
    clearSelection,
    onOptionMouseenter,
    onRootMousedown,
    onFocusout,
    onInput,
    onInputFocus,
    onInputClick,
    onInputKeydown,
} = useMultiSelect(props, {
    valueChange: (value) => emit('update:modelValue', value),
    search: (value) => emit('search', value),
});

const { getPartAttrs, getRootAttrs } = useStylesApi<MultiSelectPart>(props, 'root');
const rootAttrs = computed(() =>
    getRootAttrs({
        class: rootClass.value,
        onMousedown: onRootMousedown,
        onFocusout,
        'data-state': isOpen.value ? 'open' : 'closed',
        'data-disabled': toPresenceAttribute(control.disabled),
        'data-invalid': toPresenceAttribute(control.invalid),
    }),
);
const contentAttrs = computed(() => ({
    ...getPartAttrs('content', {
        class: 'rp-multi-select__dropdown',
        style: floatingStyle.value,
    }),
    'data-placement': actualPlacement.value,
    'data-side': placementSide.value,
}));
const listboxAttrs = computed(() => ({
    role: 'listbox',
    tabindex: -1,
    'aria-multiselectable': true,
}));
const visibleInputAttrs = computed<InputHTMLAttributes>(() => {
    const attrs = props.inputAttrs ?? {};
    const { compatibilityClass, compatibilityStyle, forwardedAttributes } =
        splitCompatibilityAttributes(attrs);

    return {
        ...forwardedAttributes,
        ...getPartAttrs('input', {
            class: 'rp-multi-select__input',
            compatibilityClass,
            compatibilityStyle,
        }),
        id: control.id,
        name: undefined,
        form: '',
        type: 'text',
        value: searchValue.value,
        placeholder: selectedOptions.value.length === 0 ? props.placeholder : undefined,
        disabled: control.disabled || undefined,
        required: undefined,
        autocomplete: forwardedAttributes.autocomplete ?? 'off',
        role: 'combobox',
        'aria-autocomplete': 'list',
        'aria-expanded': isOpen.value,
        'aria-haspopup': 'listbox',
        'aria-activedescendant': activeDescendantId.value,
        'aria-controls': listboxId,
        'aria-disabled': control.disabled || undefined,
        'aria-invalid': control.invalid || undefined,
        'aria-required': control.required || undefined,
        'aria-label': control.ariaLabelledby ? undefined : props.ariaLabel || undefined,
        'aria-labelledby': control.ariaLabelledby,
        'aria-describedby': control.ariaDescribedby,
        'data-state': isOpen.value ? 'open' : 'closed',
        'data-disabled': toPresenceAttribute(control.disabled),
        'data-invalid': toPresenceAttribute(control.invalid),
        onInput: composeEventHandlers(onInput, attrs.onInput),
        onFocus: composeEventHandlers(onInputFocus, attrs.onFocus),
        onClick: composeEventHandlers(onInputClick, attrs.onClick),
        onKeydown: composeEventHandlers(onInputKeydown, attrs.onKeydown),
    };
});

defineExpose({
    nativeElement: templateRefs.native,
    inputElement: templateRefs.input,
    focus: () => templateRefs.input.value?.focus(),
});
</script>

<style src="./multi-select.scss" lang="scss" scoped></style>
