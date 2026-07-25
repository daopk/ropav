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
import { createSingleNativeChoiceAdapter } from '@/utils/dom/nativeChoice';
import { filterOptions } from '@/utils/optionFilter';
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
    open: () => void;
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
        isControlled: transaction.isControlled,
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
    const isOpen = ref(false);
    const isSearching = ref(false);
    const generatedId = useId();
    const comboboxId = props.id ?? generatedId;
    const popupId = `${comboboxId}-popup`;
    const listboxId = `${popupId}-viewport`;
    const transaction = useComboboxTransaction(props, callbacks.valueChange, inputRef, () =>
        close(),
    );
    const selectedValue = transaction.selectedValue;
    const control = useControlState(props);
    const displayLabel = computed(() =>
        getComboboxDisplayLabel(props.options, selectedValue.value),
    );
    const searchValue = ref(displayLabel.value);
    const filterValue = computed(() => (isSearching.value ? searchValue.value : ''));
    const visibleOptions = computed(() =>
        filterOptions(props.options, filterValue.value, props.filter),
    );
    const optionCollection = useFlatOptionCollection<ComboboxOption, string | number>({
        items: () => visibleOptions.value,
        baseId: comboboxId,
        isOpen: () => isOpen.value,
        collectionRef: rootRef,
        getKey: (option) => option.value,
        isDisabled: (option) => Boolean(option.disabled),
        isSelected: (option) => option.value === selectedValue.value,
        getItemsChangeActivation: () => (isOpen.value && isSearching.value ? 'first' : undefined),
    });
    const renderedOptions = optionCollection.options;
    const highlightedIndex = optionCollection.activeIndex;
    const activeDescendantId = optionCollection.activeDescendantId;
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
    const canClear = computed(() =>
        Boolean(
            props.clearable &&
            !control.disabled &&
            (hasComboboxValue(selectedValue.value) || searchValue.value !== ''),
        ),
    );

    function setDropdownElement(elementRef: ComponentElementRef) {
        resolveHTMLElementRef(elementRef, popupId, (resolved) => {
            dropdownRef.value = resolved;
        });
    }

    function syncSearchToSelection() {
        isSearching.value = false;
        searchValue.value = displayLabel.value;
        if (inputRef.value && inputRef.value.value !== displayLabel.value) {
            inputRef.value.value = displayLabel.value;
        }
    }

    function focusInput() {
        void nextTick(() => inputRef.value?.focus());
    }

    function open() {
        if (control.disabled || isOpen.value) return;
        isOpen.value = true;
        syncSearchToSelection();
        optionCollection.activate('selected');
    }

    function close(restoreSearch = true) {
        isOpen.value = false;
        optionCollection.reset();
        if (restoreSearch) syncSearchToSelection();
    }

    function toggle() {
        if (control.disabled) return;
        if (isOpen.value) close();
        else {
            open();
            focusInput();
        }
    }

    function restoreControlledSearch(expectedValue: ComboboxValue) {
        if (!transaction.isControlled.value) return;
        queueMicrotask(() => {
            if (selectedValue.value !== expectedValue && !isOpen.value) syncSearchToSelection();
        });
    }

    function selectOption(option: ComboboxOption) {
        if (option.disabled) return;
        isSearching.value = false;
        searchValue.value = option.label;
        transaction.requestValueUpdate(option.value);
        close(false);
        restoreControlledSearch(option.value);
        focusInput();
    }

    function clearSelection() {
        if (!canClear.value) return;
        searchValue.value = '';
        isSearching.value = false;
        callbacks.search('');
        if (hasComboboxValue(selectedValue.value)) transaction.requestValueUpdate(null);
        close(false);
        restoreControlledSearch(null);
        focusInput();
    }

    function onOptionMouseenter(option: ComboboxOption) {
        optionCollection.activate(option);
    }

    function onFocusout(event: FocusEvent) {
        if (isNodeWithinElement(event.relatedTarget, rootRef.value)) return;
        close();
    }

    function onInput(event: Event) {
        if (control.disabled) return;
        const value = (event.currentTarget as HTMLInputElement).value;
        searchValue.value = value;
        isSearching.value = true;
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
        if (highlightedIndex.value < 0 || highlightedIndex.value >= visibleOptions.value.length) {
            return;
        }
        selectOption(visibleOptions.value[highlightedIndex.value]!);
    }

    function onInputKeydown(event: KeyboardEvent) {
        if (control.disabled || event.isComposing) return;

        switch (event.key) {
            case 'Enter':
                if (!isOpen.value) return;
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
            case 'Escape':
                if (!isOpen.value) return;
                event.preventDefault();
                close();
                break;
        }
    }

    watch(displayLabel, () => {
        if (!isSearching.value) searchValue.value = displayLabel.value;
    });
    watch(
        () => control.disabled,
        (disabled) => {
            if (disabled) close();
        },
    );
    useClickOutside(rootRef, isOpen, () => close());

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
        open,
        toggle,
        selectOption,
        clearSelection,
        onOptionMouseenter,
        onFocusout,
        onInput,
        onInputFocus,
        onInputClick,
        onInputKeydown,
    };
}
