import {
    computed,
    ref,
    useId,
    type CSSProperties,
    type ComputedRef,
    type Ref,
    type SelectHTMLAttributes,
} from 'vue';
import { useControlState, type ControlState } from '@/internal/composables/useControlState';
import { useEditableOptionList } from '@/internal/composables/useEditableOptionList';
import type { FlatOptionState } from '@/internal/composables/useFlatOptionCollection';
import { useHiddenSelectChoiceTransaction } from '@/internal/composables/useHiddenSelectChoiceTransaction';
import { bem } from '@/utils/bem';
import { resolveHTMLElementRef, type ComponentElementRef } from '@/utils/dom/componentRef';
import { createMultipleNativeChoiceAdapter } from '@/utils/dom/nativeChoice';
import { useFloatingPosition } from '../floating/useFloatingPosition';
import type { FloatingPlacement, FloatingSide } from '../floating/types';
import { getMultiSelectSelectedOptions, toggleMultiSelectValue } from './multiSelectModel';
import type { MultiSelectOption, MultiSelectProps, MultiSelectValue } from './types';

export interface MultiSelectControl {
    templateRefs: {
        root: Ref<HTMLElement | null>;
        input: Ref<HTMLInputElement | null>;
        native: Ref<HTMLSelectElement | null>;
    };
    nativeSelectAttrs: ComputedRef<SelectHTMLAttributes>;
    isOpen: Ref<boolean>;
    popupId: string;
    listboxId: string;
    control: ControlState;
    visibleOptions: ComputedRef<MultiSelectOption[]>;
    renderedOptions: ComputedRef<readonly FlatOptionState<MultiSelectOption>[]>;
    selectedOptions: ComputedRef<MultiSelectOption[]>;
    activeDescendantId: ComputedRef<string | undefined>;
    rootClass: ComputedRef<string[]>;
    floatingStyle: Readonly<Ref<CSSProperties>>;
    actualPlacement: Readonly<Ref<FloatingPlacement>>;
    placementSide: ComputedRef<FloatingSide>;
    searchValue: Ref<string>;
    canClear: ComputedRef<boolean>;
    setDropdownElement: (elementRef: ComponentElementRef) => void;
    toggle: () => void;
    selectOption: (option: MultiSelectOption) => void;
    removeOption: (option: MultiSelectOption) => void;
    clearSelection: () => void;
    onOptionMouseenter: (option: MultiSelectOption) => void;
    onRootMousedown: (event: MouseEvent) => void;
    onFocusout: (event: FocusEvent) => void;
    onInput: (event: Event) => void;
    onInputFocus: () => void;
    onInputClick: () => void;
    onInputKeydown: (event: KeyboardEvent) => void;
}

interface MultiSelectCallbacks {
    valueChange: (value: MultiSelectValue[]) => void;
    search: (searchValue: string) => void;
}

function useMultiSelectTransaction(
    props: Readonly<MultiSelectProps>,
    emitUpdate: (value: MultiSelectValue[]) => void,
    inputRef: Readonly<Ref<HTMLInputElement | null>>,
    onFormReset: () => void,
) {
    const transaction = useHiddenSelectChoiceTransaction<MultiSelectValue[]>({
        value: {
            modelValue: () => props.modelValue,
            defaultValue: () => [...(props.defaultValue ?? [])],
            onChange: emitUpdate,
        },
        native: {
            adapter: createMultipleNativeChoiceAdapter<MultiSelectValue>(() => props.options),
            className: 'rp-multi-select__native',
            focusVisible: () => inputRef.value?.focus(),
            validationMessage: () => props.validationMessage,
        },
        onFormReset,
    });

    return {
        nativeSelectRef: transaction.nativeSelectRef,
        nativeSelectAttrs: transaction.nativeSelectAttrs,
        requestValueUpdate: transaction.requestValueUpdate,
        selectedValues: transaction.value,
    };
}

export function useMultiSelect(
    props: Readonly<MultiSelectProps>,
    callbacks: MultiSelectCallbacks,
): MultiSelectControl {
    const rootRef = ref<HTMLElement | null>(null);
    const inputRef = ref<HTMLInputElement | null>(null);
    const dropdownRef = ref<HTMLElement | null>(null);
    const generatedId = useId();
    const multiSelectId = props.id ?? generatedId;
    const transaction = useMultiSelectTransaction(
        props,
        callbacks.valueChange,
        inputRef,
        resetAfterFormReset,
    );
    const selectedValues = transaction.selectedValues;
    const control = useControlState(props);
    const selectedOptions = computed(() =>
        getMultiSelectSelectedOptions(props.options, selectedValues.value),
    );

    function isSelected(option: MultiSelectOption) {
        return selectedValues.value.includes(option.value);
    }

    function isAtLimit() {
        return (
            props.maxValues !== undefined &&
            selectedValues.value.length >= Math.max(0, props.maxValues)
        );
    }

    function isOptionDisabled(option: MultiSelectOption) {
        return Boolean(option.disabled || (isAtLimit() && !isSelected(option)));
    }

    const optionList = useEditableOptionList<MultiSelectOption, MultiSelectValue>({
        baseId: multiSelectId,
        clearable: () => Boolean(props.clearable),
        disabled: () => control.disabled,
        filter: () => props.filter,
        getKey: (option) => option.value,
        inputRef,
        isDisabled: isOptionDisabled,
        items: () => props.options,
        onSearch: callbacks.search,
        rootRef,
        selection: {
            kind: 'multiple',
            clear: () => transaction.requestValueUpdate([]),
            hasSelection: () => selectedValues.value.length > 0,
            isSelected,
            removeLast() {
                const option = selectedOptions.value.at(-1);
                if (!option) return;
                transaction.requestValueUpdate(
                    selectedValues.value.filter((value) => value !== option.value),
                );
            },
            select(option) {
                transaction.requestValueUpdate(
                    toggleMultiSelectValue(selectedValues.value, option.value, props.maxValues),
                );
            },
        },
    });
    const { activeDescendantId, canClear, isOpen, renderedOptions, searchValue, visibleOptions } =
        optionList.state;
    const { listbox: listboxId, popup: popupId } = optionList.ids;
    const floating = useFloatingPosition({
        reference: rootRef,
        floating: dropdownRef,
        open: isOpen,
        placement: 'bottom-start',
    });
    const placementSide = computed(
        () => floating.actualPlacement.value.split('-')[0] as FloatingSide,
    );
    const rootClass = computed(() =>
        bem('rp-multi-select', {
            open: isOpen.value,
            [`size-${props.size}`]: Boolean(props.size),
            [`radius-${props.radius}`]: Boolean(props.radius),
            disabled: control.disabled,
            invalid: control.invalid,
        }),
    );

    function setDropdownElement(elementRef: ComponentElementRef) {
        resolveHTMLElementRef(elementRef, popupId, (resolved) => {
            dropdownRef.value = resolved;
        });
    }

    function resetAfterFormReset() {
        optionList.actions.resetAfterFormReset();
    }

    function removeOption(option: MultiSelectOption) {
        if (control.disabled || !isSelected(option)) return;
        transaction.requestValueUpdate(
            selectedValues.value.filter((value) => value !== option.value),
        );
        optionList.actions.focusInput();
    }

    return {
        templateRefs: {
            root: rootRef,
            input: inputRef,
            native: transaction.nativeSelectRef,
        },
        nativeSelectAttrs: transaction.nativeSelectAttrs,
        isOpen,
        popupId,
        listboxId,
        control,
        visibleOptions,
        renderedOptions,
        selectedOptions,
        activeDescendantId,
        rootClass,
        floatingStyle: floating.floatingStyle,
        actualPlacement: floating.actualPlacement,
        placementSide,
        searchValue,
        canClear,
        setDropdownElement,
        toggle: optionList.actions.toggle,
        selectOption: optionList.actions.selectOption,
        removeOption,
        clearSelection: optionList.actions.clearSelection,
        onOptionMouseenter: optionList.handlers.onOptionMouseenter,
        onRootMousedown: optionList.handlers.onRootMousedown,
        onFocusout: optionList.handlers.onFocusout,
        onInput: optionList.handlers.onInput,
        onInputFocus: optionList.handlers.onInputFocus,
        onInputClick: optionList.handlers.onInputClick,
        onInputKeydown: optionList.handlers.onInputKeydown,
    };
}
