<template>
    <div v-bind="rootAttrs" :ref="templateRefs.root">
        <select
            v-bind="nativeSelectAttrs"
            :ref="templateRefs.native"
            :name="name"
            :form="control.form"
            :disabled="control.disabled || undefined"
            :required="control.required || undefined"
            tabindex="-1"
            aria-hidden="true"
        >
            <option value="" />
            <option
                v-for="option in options"
                :key="option.value"
                :value="String(option.value)"
                :disabled="option.disabled || undefined"
            >
                {{ option.label }}
            </option>
        </select>

        <input v-bind="visibleInputAttrs" :ref="templateRefs.input" />

        <span v-bind="getPartAttrs('indicator', { class: 'rp-combobox__indicator' })">
            <button
                v-if="canClear"
                type="button"
                v-bind="getPartAttrs('clear', { class: 'rp-combobox__clear' })"
                :aria-label="clearLabel"
                tabindex="-1"
                @mousedown.prevent
                @click.stop="clearSelection"
            >
                <XIcon />
            </button>
            <button
                type="button"
                v-bind="getPartAttrs('toggle', { class: 'rp-combobox__toggle' })"
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

        <Transition name="rp-combobox-dropdown">
            <ScrollArea
                v-if="isOpen"
                :ref="setDropdownElement"
                v-bind="contentAttrs"
                :id="popupId"
                embedded
                type="auto"
                scrollbars="y"
                :viewport-attrs="{ role: 'listbox', tabindex: -1 }"
                :data-state="isOpen ? 'open' : 'closed'"
            >
                <div
                    v-if="visibleOptions.length === 0"
                    v-bind="getPartAttrs('empty', { class: 'rp-combobox__empty' })"
                >
                    <slot name="empty" :search-value="searchValue">No options</slot>
                </div>
                <div
                    v-for="(option, index) in visibleOptions"
                    :key="option.value"
                    :id="`${comboboxId}-option-${index}`"
                    role="option"
                    :aria-selected="option.value === selectedValue"
                    :aria-disabled="option.disabled || undefined"
                    :data-selected="toPresenceAttribute(option.value === selectedValue)"
                    :data-highlighted="toPresenceAttribute(index === highlightedIndex)"
                    :data-disabled="toPresenceAttribute(option.disabled)"
                    v-bind="
                        getPartAttrs('option', {
                            class: [
                                'rp-combobox__option',
                                {
                                    'rp-combobox__option--selected': option.value === selectedValue,
                                    'rp-combobox__option--highlighted': index === highlightedIndex,
                                    'rp-combobox__option--disabled': option.disabled,
                                },
                            ],
                        })
                    "
                    @mousedown.prevent
                    @click="selectOption(option)"
                    @mouseenter="onOptionMouseenter(option, index)"
                >
                    <slot
                        name="option"
                        :option="option"
                        :selected="option.value === selectedValue"
                        :highlighted="index === highlightedIndex"
                    >
                        {{ option.label }}
                    </slot>
                </div>
            </ScrollArea>
        </Transition>
    </div>
</template>

<script lang="ts" setup vapor>
import { computed, type InputHTMLAttributes } from 'vue';
import ChevronsUpDownIcon from '~icons/lucide/chevrons-up-down';
import XIcon from '~icons/lucide/x';
import { useStylesApi } from '@/styles-api';
import { toPresenceAttribute } from '@/utils/attributes';
import { composeEventHandlers, splitCompatibilityAttributes } from '@/utils/dom/attributes';
import ScrollArea from '../scroll-area/scroll-area.vue';
import { useCombobox } from './useCombobox';
import type {
    ComboboxEmptySlotProps,
    ComboboxOptionSlotProps,
    ComboboxPart,
    ComboboxProps,
} from './types';

defineOptions({ name: 'RpCombobox', inheritAttrs: false });

const props = withDefaults(defineProps<ComboboxProps>(), {
    modelValue: undefined,
    defaultValue: null,
    options: () => [],
    filter: undefined,
    placeholder: 'Search...',
    clearable: false,
    clearLabel: 'Clear selection',
    toggleLabel: 'Toggle options',
    disabled: undefined,
    required: undefined,
    invalid: undefined,
});

const emit = defineEmits<{
    'update:modelValue': [value: string | number | null];
    search: [searchValue: string];
}>();

defineSlots<{
    option?(props: ComboboxOptionSlotProps): unknown;
    empty?(props: ComboboxEmptySlotProps): unknown;
}>();

const {
    templateRefs,
    nativeSelectAttrs,
    isOpen,
    comboboxId,
    popupId,
    listboxId,
    control,
    visibleOptions,
    highlightedIndex,
    activeDescendantId,
    rootClass,
    floatingStyle,
    actualPlacement,
    placementSide,
    searchValue,
    selectedValue,
    canClear,
    setDropdownElement,
    toggle,
    selectOption,
    clearSelection,
    onOptionMouseenter,
    onFocusout,
    onInput,
    onInputFocus,
    onInputClick,
    onInputKeydown,
} = useCombobox(props, {
    valueChange: (value) => emit('update:modelValue', value),
    search: (value) => emit('search', value),
});

const { getPartAttrs, getRootAttrs } = useStylesApi<ComboboxPart>(props, 'root');
const rootAttrs = computed(() =>
    getRootAttrs({
        class: rootClass.value,
        onFocusout,
        'data-state': isOpen.value ? 'open' : 'closed',
        'data-disabled': toPresenceAttribute(control.disabled),
        'data-invalid': toPresenceAttribute(control.invalid),
    }),
);
const contentAttrs = computed(() => ({
    ...getPartAttrs('content', {
        class: 'rp-combobox__dropdown',
        style: floatingStyle.value,
    }),
    'data-placement': actualPlacement.value,
    'data-side': placementSide.value,
}));
const visibleInputAttrs = computed<InputHTMLAttributes>(() => {
    const attrs = props.inputAttrs ?? {};
    const { compatibilityClass, compatibilityStyle, forwardedAttributes } =
        splitCompatibilityAttributes(attrs);

    return {
        ...forwardedAttributes,
        ...getPartAttrs('input', {
            class: 'rp-combobox__input',
            compatibilityClass,
            compatibilityStyle,
        }),
        id: control.id,
        name: undefined,
        form: '',
        type: 'text',
        value: searchValue.value,
        placeholder: props.placeholder,
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
        'aria-label': props.ariaLabel || undefined,
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

<style src="./combobox.scss" lang="scss" scoped></style>
