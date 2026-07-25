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
import { useNativeChoiceTransaction } from '@/internal/composables/useNativeChoiceTransaction';
import { bem } from '@/utils/bem';
import { resolveHTMLElementRef, type ComponentElementRef } from '@/utils/dom/componentRef';
import { createSingleNativeChoiceAdapter } from '@/utils/dom/nativeChoice';
import { useFloatingPosition } from '../floating/useFloatingPosition';
import type { FloatingPlacement, FloatingSide } from '../floating/types';
import { getComboboxDisplayLabel, hasComboboxValue, type ComboboxValue } from './comboboxModel';
import type { ComboboxOption, ComboboxProps } from './types';

export interface ComboboxControl {
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
    visibleOptions: ComputedRef<ComboboxOption[]>;
    renderedOptions: ComputedRef<readonly FlatOptionState<ComboboxOption>[]>;
    activeDescendantId: ComputedRef<string | undefined>;
    rootClass: ComputedRef<string[]>;
    floatingStyle: Readonly<Ref<CSSProperties>>;
    actualPlacement: Readonly<Ref<FloatingPlacement>>;
    placementSide: ComputedRef<FloatingSide>;
    searchValue: Ref<string>;
    displayLabel: ComputedRef<string>;
    canClear: ComputedRef<boolean>;
    setDropdownElement: (elementRef: ComponentElementRef) => void;
    toggle: () => void;
    selectOption: (option: ComboboxOption) => void;
    clearSelection: () => void;
    onOptionMouseenter: (option: ComboboxOption) => void;
    onFocusout: (event: FocusEvent) => void;
    onInput: (event: Event) => void;
    onInputFocus: () => void;
    onInputClick: () => void;
    onInputKeydown: (event: KeyboardEvent) => void;
}

interface ComboboxCallbacks {
    valueChange: (value: ComboboxValue) => void;
    search: (searchValue: string) => void;
}

function useComboboxTransaction(
    props: Readonly<ComboboxProps>,
    emitUpdate: (value: ComboboxValue) => void,
    inputRef: Readonly<Ref<HTMLInputElement | null>>,
    onFormReset: () => void,
) {
    const transaction = useNativeChoiceTransaction<ComboboxValue>({
        value: {
            modelValue: () => props.modelValue,
            defaultValue: () => props.defaultValue ?? null,
            onChange: emitUpdate,
        },
        native: {
            adapter: createSingleNativeChoiceAdapter<ComboboxValue>({
                emptyValue: null,
                options: () => props.options,
            }),
            className: 'rp-combobox__native',
            focusVisible: () => inputRef.value?.focus(),
            syncOrder: 'before-value-change',
            validationMessage: () => props.validationMessage,
        },
        onFormReset,
    });

    return {
        nativeSelectRef: transaction.nativeSelectRef,
        nativeSelectAttrs: transaction.nativeSelectAttrs,
        requestValueUpdate: transaction.requestValueUpdate,
        selectedValue: transaction.value,
    };
}

export function useCombobox(
    props: Readonly<ComboboxProps>,
    callbacks: ComboboxCallbacks,
): ComboboxControl {
    const rootRef = ref<HTMLElement | null>(null);
    const inputRef = ref<HTMLInputElement | null>(null);
    const dropdownRef = ref<HTMLElement | null>(null);
    const generatedId = useId();
    const comboboxId = props.id ?? generatedId;
    const transaction = useComboboxTransaction(
        props,
        callbacks.valueChange,
        inputRef,
        resetAfterFormReset,
    );
    const selectedValue = transaction.selectedValue;
    const control = useControlState(props);
    const displayLabel = computed(() =>
        getComboboxDisplayLabel(props.options, selectedValue.value),
    );
    const optionList = useEditableOptionList<ComboboxOption, string | number>({
        baseId: comboboxId,
        clearable: () => Boolean(props.clearable),
        disabled: () => control.disabled,
        filter: () => props.filter,
        getKey: (option) => option.value,
        inputRef,
        isDisabled: (option) => Boolean(option.disabled),
        items: () => props.options,
        onSearch: callbacks.search,
        rootRef,
        selection: {
            kind: 'single',
            clear() {
                if (hasComboboxValue(selectedValue.value)) {
                    transaction.requestValueUpdate(null);
                }
            },
            displayValue: () => displayLabel.value,
            hasSelection: () => hasComboboxValue(selectedValue.value),
            isSelected: (option) => option.value === selectedValue.value,
            select: (option) => transaction.requestValueUpdate(option.value),
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
        bem('rp-combobox', {
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
        activeDescendantId,
        rootClass,
        floatingStyle: floating.floatingStyle,
        actualPlacement: floating.actualPlacement,
        placementSide,
        searchValue,
        displayLabel,
        canClear,
        setDropdownElement,
        toggle: optionList.actions.toggle,
        selectOption: optionList.actions.selectOption,
        clearSelection: optionList.actions.clearSelection,
        onOptionMouseenter: optionList.handlers.onOptionMouseenter,
        onFocusout: optionList.handlers.onFocusout,
        onInput: optionList.handlers.onInput,
        onInputFocus: optionList.handlers.onInputFocus,
        onInputClick: optionList.handlers.onInputClick,
        onInputKeydown: optionList.handlers.onInputKeydown,
    };
}
