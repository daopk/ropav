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
import { useActiveDescendantScroll } from '@/internal/composables/useActiveDescendantScroll';
import { useClickOutside } from '@/internal/composables/useClickOutside';
import { useCollectionNavigation } from '@/internal/composables/useCollectionNavigation';
import { useControlState, type ControlState } from '@/internal/composables/useControlState';
import { useFormControl } from '@/internal/composables/useFormControl';
import { bem } from '@/utils/bem';
import { resolveHTMLElementRef, type ComponentElementRef } from '@/utils/dom/componentRef';
import { isNodeWithinElement } from '@/utils/dom/events';
import { isInteractiveElement } from '@/utils/dom/interactive';
import { filterOptions } from '@/utils/optionFilter';
import { useFloatingPosition } from '../floating/useFloatingPosition';
import type { FloatingPlacement, FloatingSide } from '../floating/types';
import {
    getMultiSelectActiveDescendantId,
    getMultiSelectSelectedOptions,
    toggleMultiSelectValue,
} from './multiSelectModel';
import type { MultiSelectOption, MultiSelectProps, MultiSelectValue } from './types';

export interface MultiSelectControl {
    templateRefs: {
        root: Ref<HTMLElement | null>;
        input: Ref<HTMLInputElement | null>;
        native: Ref<HTMLSelectElement | null>;
    };
    nativeSelectAttrs: ComputedRef<SelectHTMLAttributes>;
    isOpen: Ref<boolean>;
    multiSelectId: string;
    popupId: string;
    listboxId: string;
    control: ControlState;
    visibleOptions: ComputedRef<MultiSelectOption[]>;
    selectedOptions: ComputedRef<MultiSelectOption[]>;
    selectedValues: ComputedRef<MultiSelectValue[]>;
    highlightedIndex: ComputedRef<number>;
    activeDescendantId: ComputedRef<string | undefined>;
    rootClass: ComputedRef<string[]>;
    floatingStyle: Readonly<Ref<CSSProperties>>;
    actualPlacement: Readonly<Ref<FloatingPlacement>>;
    placementSide: ComputedRef<FloatingSide>;
    searchValue: Ref<string>;
    canClear: ComputedRef<boolean>;
    isSelected: (option: MultiSelectOption) => boolean;
    isOptionDisabled: (option: MultiSelectOption) => boolean;
    setDropdownElement: (elementRef: ComponentElementRef) => void;
    open: () => void;
    toggle: () => void;
    selectOption: (option: MultiSelectOption) => void;
    removeOption: (option: MultiSelectOption) => void;
    clearSelection: () => void;
    onOptionMouseenter: (option: MultiSelectOption, index: number) => void;
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

function readNativeValues(
    select: HTMLSelectElement,
    options: readonly MultiSelectOption[] | undefined,
) {
    return [...select.options].flatMap((nativeOption, index) => {
        const option = options?.[index];
        return nativeOption.selected && option ? [option.value] : [];
    });
}

function writeNativeSelection(
    select: HTMLSelectElement,
    options: readonly MultiSelectOption[] | undefined,
    values: readonly MultiSelectValue[],
) {
    for (const [index, nativeOption] of [...select.options].entries()) {
        const option = options?.[index];
        nativeOption.selected = Boolean(option && values.includes(option.value));
    }
}

function writeNativeDefaultSelection(
    select: HTMLSelectElement,
    options: readonly MultiSelectOption[] | undefined,
    values: readonly MultiSelectValue[],
) {
    for (const [index, nativeOption] of [...select.options].entries()) {
        const option = options?.[index];
        nativeOption.defaultSelected = Boolean(option && values.includes(option.value));
    }
}

function useMultiSelectTransaction(
    props: Readonly<MultiSelectProps>,
    emitUpdate: (value: MultiSelectValue[]) => void,
    inputRef: Readonly<Ref<HTMLInputElement | null>>,
    onFormReset: () => void,
) {
    const nativeSelectRef = ref<HTMLSelectElement | null>(null);
    const controllable = useControllableValue<MultiSelectValue[]>({
        modelValue: () => props.modelValue,
        defaultValue: () => [...(props.defaultValue ?? [])],
        onChange: emitUpdate,
    });
    let ignoreNativeInput = false;

    function syncNativeSelection(values: readonly MultiSelectValue[]) {
        const select = nativeSelectRef.value;
        if (select) writeNativeSelection(select, props.options, values);
    }

    function requestValueUpdate(values: MultiSelectValue[]) {
        controllable.setValue(values);
        const select = nativeSelectRef.value;
        if (!select) return;

        syncNativeSelection(values);
        ignoreNativeInput = true;
        try {
            select.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
            select.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
        } finally {
            ignoreNativeInput = false;
        }

        if (controllable.isControlled.value) {
            queueMicrotask(() => syncNativeSelection(controllable.value.value));
        }
    }

    const nativeSelectAttrs = computed<SelectHTMLAttributes>(() => ({
        class: 'rp-multi-select__native',
        onInput: (event: Event) => {
            if (!ignoreNativeInput) {
                controllable.setValue(
                    readNativeValues(event.currentTarget as HTMLSelectElement, props.options),
                );
            }
        },
        onInvalid: (event: Event) => {
            event.preventDefault();
            inputRef.value?.focus();
        },
    }));

    useFormControl({
        elements: () => [nativeSelectRef.value],
        isControlled: () => controllable.isControlled.value,
        validationMessage: () => props.validationMessage,
        readResetValue() {
            controllable.resetValue();
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
    watchEffect(() => syncNativeSelection(controllable.value.value), { flush: 'post' });

    return {
        nativeSelectRef,
        nativeSelectAttrs,
        requestValueUpdate,
        selectedValues: controllable.value,
    };
}

function useMultiSelectNavigation(options: {
    baseId: string;
    collectionRef: Readonly<Ref<HTMLElement | null>>;
    isOpen: Readonly<Ref<boolean>>;
    isDisabled: (option: MultiSelectOption) => boolean;
    isSelected: (option: MultiSelectOption) => boolean;
    items: ComputedRef<MultiSelectOption[]>;
}) {
    const navigation = useCollectionNavigation<MultiSelectOption, MultiSelectValue>({
        items: () => options.items.value,
        getKey: (option) => option.value,
        isDisabled: options.isDisabled,
        isSelected: options.isSelected,
    });
    const highlightedIndex = navigation.activeIndex;
    const activeDescendantId = computed(() =>
        getMultiSelectActiveDescendantId(
            options.baseId,
            highlightedIndex.value,
            options.isOpen.value,
        ),
    );

    useActiveDescendantScroll({
        activeDescendantId,
        collectionRef: options.collectionRef,
    });
    watch(options.items, () => {
        if (options.isOpen.value && highlightedIndex.value < 0) navigation.focusFirst();
    });

    return { activeDescendantId, highlightedIndex, navigation };
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

    const { activeDescendantId, highlightedIndex, navigation } = useMultiSelectNavigation({
        baseId: multiSelectId,
        collectionRef: rootRef,
        isOpen,
        isDisabled: isOptionDisabled,
        isSelected,
        items: visibleOptions,
    });
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
        navigation.focusSelected();
    }

    function close() {
        isOpen.value = false;
        navigation.resetActive();
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

    function focusOption(option: MultiSelectOption) {
        const index = visibleOptions.value.findIndex(
            (candidate) => candidate.value === option.value,
        );
        if (index >= 0) navigation.setActiveIndex(index);
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
        focusOption(option);
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

    function onOptionMouseenter(option: MultiSelectOption, index: number) {
        if (!isOptionDisabled(option)) navigation.setActiveIndex(index);
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
        navigation.focusFirst();
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
        multiSelectId,
        popupId,
        listboxId,
        control,
        visibleOptions,
        selectedOptions,
        selectedValues,
        highlightedIndex,
        activeDescendantId,
        rootClass,
        floatingStyle: floating.floatingStyle,
        actualPlacement: floating.actualPlacement,
        placementSide,
        searchValue,
        canClear,
        isSelected,
        isOptionDisabled,
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
