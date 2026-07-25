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
import { useTypeahead } from '@/internal/composables/useTypeahead';
import { bem } from '@/utils/bem';
import { composeEventHandlers, splitCompatibilityAttributes } from '@/utils/dom/attributes';
import { resolveHTMLElementRef, type ComponentElementRef } from '@/utils/dom/componentRef';
import { isNodeWithinElement } from '@/utils/dom/events';
import { useFloatingPosition } from '../floating/useFloatingPosition';
import type { FloatingPlacement, FloatingSide } from '../floating/types';
import type { SelectOption, SelectProps } from './types';

type SelectValue = string | number | null;

export interface SelectControl {
    templateRefs: {
        select: Ref<HTMLElement | null>;
        trigger: Ref<HTMLElement | null>;
        native: Ref<HTMLSelectElement | null>;
    };
    nativeInputAttrs: ComputedRef<SelectHTMLAttributes>;
    isOpen: Ref<boolean>;
    selectId: string;
    popupId: string;
    listboxId: string;
    control: ControlState;
    visibleOptions: ComputedRef<SelectOption[]>;
    focusedIndex: ComputedRef<number>;
    activeDescendantId: ComputedRef<string | undefined>;
    rootClass: ComputedRef<string[]>;
    floatingStyle: Readonly<Ref<CSSProperties>>;
    actualPlacement: Readonly<Ref<FloatingPlacement>>;
    placementSide: ComputedRef<FloatingSide>;
    hasValue: ComputedRef<boolean>;
    displayLabel: ComputedRef<string>;
    selectedValue: ComputedRef<SelectValue>;
    canClear: ComputedRef<boolean>;
    setDropdownElement: (value: ComponentElementRef) => void;
    toggle: () => void;
    selectOption: (option: SelectOption) => void;
    clearSelection: () => void;
    onOptionMouseenter: (option: SelectOption, index: number) => void;
    onFocusout: (event: FocusEvent) => void;
    onTriggerKeydown: (event: KeyboardEvent) => void;
}

function hasSelectValue(value: SelectValue) {
    return value != null && value !== '';
}

function getSelectDisplayLabel(options: SelectOption[] | undefined, value: SelectValue) {
    if (!hasSelectValue(value)) return '';
    return options?.find((option) => option.value === value)?.label ?? '';
}

function getSelectActiveDescendantId(baseId: string, focusedIndex: number, isOpen: boolean) {
    return !isOpen || focusedIndex < 0 ? undefined : `${baseId}-option-${focusedIndex}`;
}

function readNativeValue(select: HTMLSelectElement, options: SelectOption[] | undefined) {
    if (select.selectedIndex <= 0) return null;
    return options?.[select.selectedIndex - 1]?.value ?? null;
}

function writeNativeSelection(
    select: HTMLSelectElement,
    options: SelectOption[] | undefined,
    value: SelectValue,
) {
    const optionIndex = options?.findIndex((option) => option.value === value) ?? -1;
    select.selectedIndex = optionIndex + 1;
}

function writeNativeDefaultSelection(
    select: HTMLSelectElement,
    options: SelectOption[] | undefined,
    value: SelectValue,
) {
    const optionIndex = options?.findIndex((option) => option.value === value) ?? -1;
    for (const [index, option] of [...select.options].entries()) {
        option.defaultSelected = index === optionIndex + 1;
    }
}

function useSelectTransaction(
    props: Readonly<SelectProps>,
    emitUpdate: (value: SelectValue) => void,
    triggerRef: Readonly<Ref<HTMLElement | null>>,
) {
    const nativeSelectRef = ref<HTMLSelectElement | null>(null);
    const controllable = useControllableValue<SelectValue>({
        modelValue: () => props.modelValue,
        defaultValue: () => props.defaultValue ?? null,
        onChange: emitUpdate,
    });

    function syncNativeSelection(value: SelectValue) {
        const select = nativeSelectRef.value;
        if (select) writeNativeSelection(select, props.options, value);
    }

    function requestValueUpdate(value: SelectValue) {
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

    useFormControl({
        elements: () => [nativeSelectRef.value],
        isControlled: () => controllable.isControlled.value,
        validationMessage: () => props.validationMessage,
        readResetValue([select]) {
            controllable.resetValue(readNativeValue(select as HTMLSelectElement, props.options));
        },
        syncControlledValue() {
            syncNativeSelection(controllable.value.value);
        },
    });

    const nativeInputAttrs = computed<SelectHTMLAttributes>(() => {
        const compatibilityAttrs = props.inputAttrs ?? {};
        const { compatibilityClass, compatibilityStyle, forwardedAttributes } =
            splitCompatibilityAttributes(compatibilityAttrs);

        return {
            ...forwardedAttributes,
            class: ['rp-select__native', compatibilityClass],
            style: compatibilityStyle,
            onInput: composeEventHandlers<InputEvent>(
                (event) =>
                    controllable.setValue(
                        readNativeValue(event.currentTarget as HTMLSelectElement, props.options),
                    ),
                compatibilityAttrs.onInput,
            ),
            onChange: compatibilityAttrs.onChange,
            onInvalid: composeEventHandlers<Event>((event) => {
                event.preventDefault();
                triggerRef.value?.focus();
            }, compatibilityAttrs.onInvalid),
        };
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
        nativeInputAttrs,
        requestValueUpdate,
        selectedValue: controllable.value,
    };
}

export function useSelect(
    props: Readonly<SelectProps>,
    emitUpdate: (value: SelectValue) => void,
): SelectControl {
    const selectRef = ref<HTMLElement | null>(null);
    const triggerRef = ref<HTMLElement | null>(null);
    const dropdownRef = ref<HTMLElement | null>(null);
    const isOpen = ref(false);
    const transaction = useSelectTransaction(props, emitUpdate, triggerRef);
    const value = transaction.selectedValue;

    const selectId = useId();
    const popupId = `${selectId}-popup`;
    const listboxId = `${popupId}-viewport`;

    const control = useControlState(props);
    const visibleOptions = computed(() => props.options ?? []);

    const navigation = useCollectionNavigation<SelectOption, string | number>({
        items: () => visibleOptions.value,
        getKey: (item) => item.value,
        isDisabled: (item) => Boolean(item.disabled),
        isSelected: (item) => item.value === value.value,
    });

    const focusedIndex = navigation.activeIndex;
    const selectedIndex = computed(() =>
        visibleOptions.value.findIndex(
            (option) => option.value === value.value && !option.disabled,
        ),
    );
    const activeDescendantId = computed(() =>
        getSelectActiveDescendantId(selectId, focusedIndex.value, isOpen.value),
    );
    const floating = useFloatingPosition({
        reference: triggerRef,
        floating: dropdownRef,
        open: isOpen,
        placement: 'bottom-start',
    });
    const placementSide = computed(
        () => floating.actualPlacement.value.split('-')[0] as FloatingSide,
    );

    const typeahead = useTypeahead<SelectOption>({
        items: () => visibleOptions.value,
        activeIndex: () => (isOpen.value ? focusedIndex.value : selectedIndex.value),
        getKey: (item) => item.value,
        getTextValue: (item) => item.label,
        isDisabled: (item) => Boolean(item.disabled),
        onMatch(item, index) {
            if (isOpen.value) {
                navigation.setActiveIndex(index);
            } else if (item.value !== value.value) {
                transaction.requestValueUpdate(item.value);
            }
        },
    });

    const rootClass = computed(() =>
        bem('rp-select', {
            open: isOpen.value,
            [`size-${props.size}`]: Boolean(props.size),
            [`radius-${props.radius}`]: Boolean(props.radius),
            disabled: control.disabled,
            invalid: control.invalid,
        }),
    );

    const hasValue = computed(() => hasSelectValue(value.value));
    const displayLabel = computed(() => getSelectDisplayLabel(props.options, value.value));
    const canClear = computed(() =>
        Boolean(props.clearable && hasValue.value && !control.disabled),
    );

    function setDropdownElement(elementRef: ComponentElementRef) {
        resolveHTMLElementRef(elementRef, popupId, (resolved) => {
            dropdownRef.value = resolved;
        });
    }

    function focusTrigger() {
        nextTick(() => triggerRef.value?.focus());
    }

    function open() {
        if (control.disabled || isOpen.value) return;
        typeahead.reset();
        isOpen.value = true;
        navigation.focusSelected();
    }

    function close() {
        isOpen.value = false;
        navigation.resetActive();
        typeahead.reset();
    }

    function toggle() {
        if (control.disabled) return;
        if (isOpen.value) {
            close();
            focusTrigger();
        } else {
            open();
        }
    }

    function selectOption(option: SelectOption) {
        if (option.disabled) return;
        transaction.requestValueUpdate(option.value);
        close();
        focusTrigger();
    }

    function clearSelection() {
        if (!canClear.value) return;
        transaction.requestValueUpdate(null);
        close();
        focusTrigger();
    }

    function onOptionMouseenter(option: SelectOption, index: number) {
        if (!option.disabled) navigation.setActiveIndex(index);
    }

    function onFocusout(event: FocusEvent) {
        if (isNodeWithinElement(event.relatedTarget, selectRef.value)) return;
        close();
    }

    function selectFocusedOption() {
        if (focusedIndex.value < 0 || focusedIndex.value >= visibleOptions.value.length) return;
        selectOption(visibleOptions.value[focusedIndex.value]!);
    }

    function onTriggerKeydown(e: KeyboardEvent) {
        if (control.disabled) return;
        if (typeahead.handleKey(e)) return;

        switch (e.key) {
            case 'Enter':
                e.preventDefault();
                if (!isOpen.value) open();
                else selectFocusedOption();
                break;
            case ' ':
                e.preventDefault();
                if (!isOpen.value) open();
                else selectFocusedOption();
                break;
            case 'ArrowDown':
                e.preventDefault();
                if (!isOpen.value) open();
                else navigation.moveFocus(1);
                break;
            case 'ArrowUp':
                e.preventDefault();
                if (!isOpen.value) {
                    open();
                    navigation.focusLast();
                } else {
                    navigation.moveFocus(-1);
                }
                break;
            case 'Home':
                if (isOpen.value) {
                    e.preventDefault();
                    navigation.focusFirst();
                }
                break;
            case 'End':
                if (isOpen.value) {
                    e.preventDefault();
                    navigation.focusLast();
                }
                break;
            case 'Delete':
            case 'Backspace':
                if (canClear.value) {
                    e.preventDefault();
                    clearSelection();
                }
                break;
            case 'Escape':
                e.preventDefault();
                close();
                focusTrigger();
                break;
        }
    }

    watch(focusedIndex, (index) => {
        if (!isOpen.value || index < 0) return;

        void nextTick(() => {
            if (!isOpen.value || focusedIndex.value !== index) return;

            selectRef.value
                ?.querySelector<HTMLElement>(`[id="${selectId}-option-${index}"]`)
                ?.scrollIntoView?.({ block: 'nearest' });
        });
    });

    useClickOutside(selectRef, isOpen, close);

    return {
        templateRefs: {
            select: selectRef,
            trigger: triggerRef,
            native: transaction.nativeSelectRef,
        },
        nativeInputAttrs: transaction.nativeInputAttrs,
        isOpen,
        selectId,
        popupId,
        listboxId,
        control,
        visibleOptions,
        focusedIndex,
        activeDescendantId,
        rootClass,
        floatingStyle: floating.floatingStyle,
        actualPlacement: floating.actualPlacement,
        placementSide,
        hasValue,
        displayLabel,
        selectedValue: value,
        canClear,
        setDropdownElement,
        toggle,
        selectOption,
        clearSelection,
        onOptionMouseenter,
        onFocusout,
        onTriggerKeydown,
    };
}
