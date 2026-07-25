import {
    computed,
    nextTick,
    ref,
    useId,
    watch,
    type CSSProperties,
    type ComputedRef,
    type Ref,
    type SelectHTMLAttributes,
} from 'vue';
import { useClickOutside } from '@/internal/composables/useClickOutside';
import { useControlState, type ControlState } from '@/internal/composables/useControlState';
import {
    useFlatOptionCollection,
    type FlatOptionState,
} from '@/internal/composables/useFlatOptionCollection';
import { useNativeChoiceTransaction } from '@/internal/composables/useNativeChoiceTransaction';
import { bem } from '@/utils/bem';
import { resolveHTMLElementRef, type ComponentElementRef } from '@/utils/dom/componentRef';
import { isNodeWithinElement } from '@/utils/dom/events';
import { isInteractiveElement } from '@/utils/dom/interactive';
import { createMultipleNativeChoiceAdapter } from '@/utils/dom/nativeChoice';
import { filterOptions } from '@/utils/optionFilter';
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
    open: () => void;
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
    const transaction = useNativeChoiceTransaction<MultiSelectValue[]>({
        value: {
            modelValue: () => props.modelValue,
            defaultValue: () => [...(props.defaultValue ?? [])],
            onChange: emitUpdate,
        },
        native: {
            adapter: createMultipleNativeChoiceAdapter<MultiSelectValue>(() => props.options),
            className: 'rp-multi-select__native',
            focusVisible: () => inputRef.value?.focus(),
            syncOrder: 'after-value-change',
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
    const isOpen = ref(false);
    const searchValue = ref('');
    const generatedId = useId();
    const multiSelectId = props.id ?? generatedId;
    const popupId = `${multiSelectId}-popup`;
    const listboxId = `${popupId}-viewport`;
    const transaction = useMultiSelectTransaction(
        props,
        callbacks.valueChange,
        inputRef,
        resetAfterFormReset,
    );
    const selectedValues = transaction.selectedValues;
    const control = useControlState(props);
    const visibleOptions = computed(() =>
        filterOptions(props.options, searchValue.value, props.filter),
    );
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

    const optionCollection = useFlatOptionCollection<MultiSelectOption, MultiSelectValue>({
        items: () => visibleOptions.value,
        baseId: multiSelectId,
        collectionRef: rootRef,
        isOpen: () => isOpen.value,
        getKey: (option) => option.value,
        isDisabled: isOptionDisabled,
        isSelected,
        getItemsChangeActivation: () => (isOpen.value ? 'first' : undefined),
    });
    const renderedOptions = optionCollection.options;
    const activeDescendantId = optionCollection.activeDescendantId;
    const highlightedIndex = optionCollection.activeIndex;
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
    const canClear = computed(() =>
        Boolean(props.clearable && selectedValues.value.length > 0 && !control.disabled),
    );

    function setDropdownElement(elementRef: ComponentElementRef) {
        resolveHTMLElementRef(elementRef, popupId, (resolved) => {
            dropdownRef.value = resolved;
        });
    }

    function focusInput() {
        void nextTick(() => inputRef.value?.focus());
    }

    function open() {
        if (control.disabled || isOpen.value) return;
        isOpen.value = true;
        optionCollection.activate('selected');
    }

    function close() {
        isOpen.value = false;
        optionCollection.reset();
    }

    function toggle() {
        if (control.disabled) return;
        if (isOpen.value) close();
        else open();
        focusInput();
    }

    function resetSearch() {
        if (searchValue.value === '') return;
        searchValue.value = '';
        callbacks.search('');
        if (inputRef.value) inputRef.value.value = '';
    }

    function resetAfterFormReset() {
        close();
        resetSearch();
    }

    function selectOption(option: MultiSelectOption) {
        if (isOptionDisabled(option)) return;
        const nextValues = toggleMultiSelectValue(
            selectedValues.value,
            option.value,
            props.maxValues,
        );
        transaction.requestValueUpdate(nextValues);
        resetSearch();
        optionCollection.activate(option);
        focusInput();
    }

    function removeOption(option: MultiSelectOption) {
        if (control.disabled || !isSelected(option)) return;
        transaction.requestValueUpdate(
            selectedValues.value.filter((value) => value !== option.value),
        );
        focusInput();
    }

    function clearSelection() {
        if (!canClear.value) return;
        transaction.requestValueUpdate([]);
        resetSearch();
        focusInput();
    }

    function onOptionMouseenter(option: MultiSelectOption) {
        optionCollection.activate(option);
    }

    function onRootMousedown(event: MouseEvent) {
        if (control.disabled) return;
        if (isInteractiveElement(event.target, '.rp-multi-select__input')) return;
        open();
        inputRef.value?.focus();
    }

    function onFocusout(event: FocusEvent) {
        if (isNodeWithinElement(event.relatedTarget, rootRef.value)) return;
        close();
    }

    function onInput(event: Event) {
        if (control.disabled) return;
        const value = (event.currentTarget as HTMLInputElement).value;
        searchValue.value = value;
        callbacks.search(value);
        if (!isOpen.value) isOpen.value = true;
        optionCollection.activate('first');
    }

    function onInputFocus() {
        open();
    }

    function onInputClick() {
        open();
    }

    function selectHighlightedOption() {
        const option = visibleOptions.value[highlightedIndex.value];
        if (option) selectOption(option);
    }

    function removeLastOption() {
        const option = selectedOptions.value.at(-1);
        if (option) removeOption(option);
    }

    function onInputKeydown(event: KeyboardEvent) {
        if (control.disabled || event.isComposing) return;

        switch (event.key) {
            case 'Enter':
                if (!isOpen.value || highlightedIndex.value < 0) return;
                event.preventDefault();
                selectHighlightedOption();
                break;
            case 'ArrowDown':
                event.preventDefault();
                if (!isOpen.value) open();
                else optionCollection.move(1);
                break;
            case 'ArrowUp':
                event.preventDefault();
                if (!isOpen.value) {
                    open();
                    optionCollection.activate('last');
                } else {
                    optionCollection.move(-1);
                }
                break;
            case 'Backspace':
                if (searchValue.value === '') removeLastOption();
                break;
            case 'Escape':
                if (!isOpen.value) return;
                event.preventDefault();
                close();
                break;
        }
    }

    watch(
        () => control.disabled,
        (disabled) => {
            if (disabled) close();
        },
    );
    useClickOutside(rootRef, isOpen, close);

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
        open,
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
    };
}
