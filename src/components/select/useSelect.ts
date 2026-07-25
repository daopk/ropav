import {
    computed,
    nextTick,
    ref,
    useId,
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
import { useTypeahead } from '@/internal/composables/useTypeahead';
import { bem } from '@/utils/bem';
import { resolveHTMLElementRef, type ComponentElementRef } from '@/utils/dom/componentRef';
import { isNodeWithinElement } from '@/utils/dom/events';
import { createSingleNativeChoiceAdapter } from '@/utils/dom/nativeChoice';
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
    popupId: string;
    listboxId: string;
    control: ControlState;
    visibleOptions: ComputedRef<SelectOption[]>;
    renderedOptions: ComputedRef<readonly FlatOptionState<SelectOption>[]>;
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
    onOptionMouseenter: (option: SelectOption) => void;
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

function useSelectTransaction(
    props: Readonly<SelectProps>,
    emitUpdate: (value: SelectValue) => void,
    triggerRef: Readonly<Ref<HTMLElement | null>>,
) {
    const transaction = useNativeChoiceTransaction<SelectValue>({
        value: {
            modelValue: () => props.modelValue,
            defaultValue: () => props.defaultValue ?? null,
            onChange: emitUpdate,
        },
        native: {
            adapter: createSingleNativeChoiceAdapter<SelectValue>({
                emptyValue: null,
                options: () => props.options,
            }),
            attributes: () => props.inputAttrs,
            className: 'rp-select__native',
            focusVisible: () => triggerRef.value?.focus(),
            syncOrder: 'before-value-change',
            validationMessage: () => props.validationMessage,
        },
    });

    return {
        nativeSelectRef: transaction.nativeSelectRef,
        nativeInputAttrs: transaction.nativeSelectAttrs,
        requestValueUpdate: transaction.requestValueUpdate,
        selectedValue: transaction.value,
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

    const optionCollection = useFlatOptionCollection<SelectOption, string | number>({
        items: () => visibleOptions.value,
        baseId: selectId,
        isOpen: () => isOpen.value,
        collectionRef: selectRef,
        getKey: (item) => item.value,
        isDisabled: (item) => Boolean(item.disabled),
        isSelected: (item) => item.value === value.value,
    });

    const renderedOptions = optionCollection.options;
    const focusedIndex = optionCollection.activeIndex;
    const selectedIndex = computed(() =>
        visibleOptions.value.findIndex(
            (option) => option.value === value.value && !option.disabled,
        ),
    );
    const activeDescendantId = optionCollection.activeDescendantId;
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
        onMatch(item) {
            if (isOpen.value) {
                optionCollection.activate(item);
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
        optionCollection.activate('selected');
    }

    function close() {
        isOpen.value = false;
        optionCollection.reset();
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

    function onOptionMouseenter(option: SelectOption) {
        optionCollection.activate(option);
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
                else optionCollection.move(1);
                break;
            case 'ArrowUp':
                e.preventDefault();
                if (!isOpen.value) {
                    open();
                    optionCollection.activate('last');
                } else {
                    optionCollection.move(-1);
                }
                break;
            case 'Home':
                if (isOpen.value) {
                    e.preventDefault();
                    optionCollection.activate('first');
                }
                break;
            case 'End':
                if (isOpen.value) {
                    e.preventDefault();
                    optionCollection.activate('last');
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

    useClickOutside(selectRef, isOpen, close);

    return {
        templateRefs: {
            select: selectRef,
            trigger: triggerRef,
            native: transaction.nativeSelectRef,
        },
        nativeInputAttrs: transaction.nativeInputAttrs,
        isOpen,
        popupId,
        listboxId,
        control,
        visibleOptions,
        renderedOptions,
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
