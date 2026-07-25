import {
    computed,
    nextTick,
    ref,
    useId,
    watch,
    watchEffect,
    type CSSProperties,
    type ComputedRef,
    type Ref,
    type SelectHTMLAttributes,
} from 'vue';
import { useControllableValue } from '@/composables/useControllableValue';
import { useClickOutside } from '@/internal/composables/useClickOutside';
import { useCollectionNavigation } from '@/internal/composables/useCollectionNavigation';
import { useControlState, type ControlState } from '@/internal/composables/useControlState';
import { useFormControl } from '@/internal/composables/useFormControl';
import { bem } from '@/utils/bem';
import { resolveHTMLElementRef, type ComponentElementRef } from '@/utils/dom/componentRef';
import { isNodeWithinElement } from '@/utils/dom/events';
import { useFloatingPosition } from '../floating/useFloatingPosition';
import type { FloatingPlacement, FloatingSide } from '../floating/types';
import {
    filterComboboxOptions,
    getComboboxActiveDescendantId,
    getComboboxDisplayLabel,
    hasComboboxValue,
    type ComboboxValue,
} from './comboboxModel';
import type { ComboboxOption, ComboboxProps } from './types';

export interface ComboboxControl {
    templateRefs: {
        root: Ref<HTMLElement | null>;
        input: Ref<HTMLInputElement | null>;
        native: Ref<HTMLSelectElement | null>;
    };
    nativeSelectAttrs: ComputedRef<SelectHTMLAttributes>;
    isOpen: Ref<boolean>;
    comboboxId: string;
    popupId: string;
    listboxId: string;
    control: ControlState;
    visibleOptions: ComputedRef<ComboboxOption[]>;
    highlightedIndex: ComputedRef<number>;
    activeDescendantId: ComputedRef<string | undefined>;
    rootClass: ComputedRef<string[]>;
    floatingStyle: Readonly<Ref<CSSProperties>>;
    actualPlacement: Readonly<Ref<FloatingPlacement>>;
    placementSide: ComputedRef<FloatingSide>;
    searchValue: Ref<string>;
    displayLabel: ComputedRef<string>;
    selectedValue: ComputedRef<ComboboxValue>;
    canClear: ComputedRef<boolean>;
    setDropdownElement: (elementRef: ComponentElementRef) => void;
    open: () => void;
    toggle: () => void;
    selectOption: (option: ComboboxOption) => void;
    clearSelection: () => void;
    onOptionMouseenter: (option: ComboboxOption, index: number) => void;
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

function readNativeValue(
    select: HTMLSelectElement,
    options: readonly ComboboxOption[] | undefined,
) {
    if (select.selectedIndex <= 0) return null;
    return options?.[select.selectedIndex - 1]?.value ?? null;
}

function writeNativeSelection(
    select: HTMLSelectElement,
    options: readonly ComboboxOption[] | undefined,
    value: ComboboxValue,
) {
    const optionIndex = options?.findIndex((option) => option.value === value) ?? -1;
    select.selectedIndex = optionIndex + 1;
}

function writeNativeDefaultSelection(
    select: HTMLSelectElement,
    options: readonly ComboboxOption[] | undefined,
    value: ComboboxValue,
) {
    const optionIndex = options?.findIndex((option) => option.value === value) ?? -1;
    for (const [index, option] of [...select.options].entries()) {
        option.defaultSelected = index === optionIndex + 1;
    }
}

function useComboboxTransaction(
    props: Readonly<ComboboxProps>,
    emitUpdate: (value: ComboboxValue) => void,
    inputRef: Readonly<Ref<HTMLInputElement | null>>,
    onFormReset: () => void,
) {
    const nativeSelectRef = ref<HTMLSelectElement | null>(null);
    const controllable = useControllableValue<ComboboxValue>({
        modelValue: () => props.modelValue,
        defaultValue: () => props.defaultValue ?? null,
        onChange: emitUpdate,
    });

    function syncNativeSelection(value: ComboboxValue) {
        const select = nativeSelectRef.value;
        if (select) writeNativeSelection(select, props.options, value);
    }

    function requestValueUpdate(value: ComboboxValue) {
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

    const nativeSelectAttrs = computed<SelectHTMLAttributes>(() => ({
        class: 'rp-combobox__native',
        onInput: (event: Event) =>
            controllable.setValue(
                readNativeValue(event.currentTarget as HTMLSelectElement, props.options),
            ),
        onInvalid: (event: Event) => {
            event.preventDefault();
            inputRef.value?.focus();
        },
    }));

    useFormControl({
        elements: () => [nativeSelectRef.value],
        isControlled: () => controllable.isControlled.value,
        validationMessage: () => props.validationMessage,
        readResetValue([select]) {
            controllable.resetValue(readNativeValue(select as HTMLSelectElement, props.options));
            onFormReset();
        },
        syncControlledValue() {
            syncNativeSelection(controllable.value.value);
            onFormReset();
        },
    });

    watchEffect(
        () => {
            const select = nativeSelectRef.value;
            if (select)
                writeNativeDefaultSelection(select, props.options, controllable.initialValue);
        },
        { flush: 'post' },
    );
    watchEffect(
        () => {
            syncNativeSelection(controllable.value.value);
            void nextTick(() => syncNativeSelection(controllable.value.value));
        },
        { flush: 'post' },
    );

    return {
        isControlled: controllable.isControlled,
        nativeSelectRef,
        nativeSelectAttrs,
        requestValueUpdate,
        selectedValue: controllable.value,
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
        filterComboboxOptions(props.options, filterValue.value, props.filter),
    );
    const navigation = useCollectionNavigation<ComboboxOption, string | number>({
        items: () => visibleOptions.value,
        getKey: (option) => option.value,
        isDisabled: (option) => Boolean(option.disabled),
        isSelected: (option) => option.value === selectedValue.value,
    });
    const highlightedIndex = navigation.activeIndex;
    const activeDescendantId = computed(() =>
        getComboboxActiveDescendantId(comboboxId, highlightedIndex.value, isOpen.value),
    );
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
        navigation.focusSelected();
    }

    function close(restoreSearch = true) {
        isOpen.value = false;
        navigation.resetActive();
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

    function onOptionMouseenter(option: ComboboxOption, index: number) {
        if (!option.disabled) navigation.setActiveIndex(index);
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
        navigation.focusFirst();
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
                else navigation.moveFocus(1);
                break;
            case 'ArrowUp':
                event.preventDefault();
                if (!isOpen.value) {
                    open();
                    navigation.focusLast();
                } else {
                    navigation.moveFocus(-1);
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
    watch(visibleOptions, () => {
        if (isOpen.value && isSearching.value && highlightedIndex.value < 0) {
            navigation.focusFirst();
        }
    });
    watch(highlightedIndex, (index) => {
        if (!isOpen.value || index < 0) return;

        void nextTick(() => {
            if (!isOpen.value || highlightedIndex.value !== index) return;
            rootRef.value
                ?.querySelector<HTMLElement>(`[id="${comboboxId}-option-${index}"]`)
                ?.scrollIntoView?.({ block: 'nearest' });
        });
    });

    useClickOutside(rootRef, isOpen, () => close());

    return {
        templateRefs: {
            root: rootRef,
            input: inputRef,
            native: transaction.nativeSelectRef,
        },
        nativeSelectAttrs: transaction.nativeSelectAttrs,
        isOpen,
        comboboxId,
        popupId,
        listboxId,
        control,
        visibleOptions,
        highlightedIndex,
        activeDescendantId,
        rootClass,
        floatingStyle: floating.floatingStyle,
        actualPlacement: floating.actualPlacement,
        placementSide,
        searchValue,
        displayLabel,
        selectedValue,
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
