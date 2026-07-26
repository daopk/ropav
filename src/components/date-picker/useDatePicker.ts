import { computed, nextTick, type InputHTMLAttributes } from 'vue';
import { bem } from '@/utils/bem';
import { isNodeWithinElement } from '@/utils/dom/events';
import type { PopoverSlotProps } from '../popover/types';
import type { DatePickerProps } from './types';
import { useDatePickerValueState } from './useDatePickerValueState';

interface DatePickerEmitters {
    value: (value: Date | null) => void;
    change: (value: Date | null) => void;
    open: (open: boolean) => void;
}

interface DatePickerElements {
    getInput: () => HTMLInputElement | null;
    focusCalendar: () => void;
}

export function useDatePicker(
    props: Readonly<DatePickerProps>,
    emit: DatePickerEmitters,
    elements: DatePickerElements,
) {
    const valueState = useDatePickerValueState({
        props,
        getInput: elements.getInput,
        onChange(value) {
            emit.value(value);
            emit.change(value);
        },
    });
    const {
        control,
        selectedDate,
        inputValue,
        isInputEditable,
        isInvalid,
        validationMessage: effectiveValidationMessage,
        canClear,
        updateInput: onInputUpdate,
        blurInput: onInputBlur,
    } = valueState;
    const rootClass = computed(() =>
        bem('rp-date-picker', {
            [`size-${props.size}`]: Boolean(props.size),
            [`radius-${props.radius}`]: Boolean(props.radius),
            disabled: control.disabled,
            readonly: props.readonly,
            invalid: isInvalid.value,
            valid: control.valid && !isInvalid.value,
        }),
    );
    let openPicker: PopoverSlotProps['open'] | undefined;
    let closePicker: PopoverSlotProps['close'] | undefined;
    let suppressFocusOpen = false;
    let pointerDownStartedFocused: boolean | undefined;

    function getInputTriggerAttrs(slotProps: unknown): InputHTMLAttributes {
        const popover = slotProps as PopoverSlotProps;
        const trigger = popover.triggerProps;
        const attrs = props.inputAttrs ?? {};

        if (!trigger['aria-haspopup']) return attrs;

        openPicker = popover.open;
        closePicker = popover.close;

        return {
            ...attrs,
            role: 'combobox',
            'aria-autocomplete': 'none',
            'aria-controls': trigger['aria-controls'],
            'aria-expanded': trigger['aria-expanded'],
            'aria-haspopup': trigger['aria-haspopup'],
            'aria-readonly': isInputEditable.value ? attrs['aria-readonly'] : true,
            autocomplete: attrs.autocomplete ?? 'off',
            inputmode: isInputEditable.value ? attrs.inputmode : 'none',
            onBeforeinput(event) {
                if (!isInputEditable.value) event.preventDefault();
                attrs.onBeforeinput?.(event);
            },
            onInput(event) {
                if (!isInputEditable.value && event.currentTarget instanceof HTMLInputElement) {
                    event.currentTarget.value = inputValue.value;
                }
                attrs.onInput?.(event);
            },
            onPointerdown(event) {
                pointerDownStartedFocused =
                    event.currentTarget instanceof HTMLElement &&
                    event.currentTarget.ownerDocument.activeElement === event.currentTarget;
                attrs.onPointerdown?.(event);
            },
            onFocusin(event) {
                if (!suppressFocusOpen) popover.open();
                attrs.onFocusin?.(event);
            },
            onClick(event) {
                if (pointerDownStartedFocused !== false) popover.open();
                pointerDownStartedFocused = undefined;
                attrs.onClick?.(event);
            },
            onBlur(event) {
                pointerDownStartedFocused = undefined;
                onInputBlur();
                attrs.onBlur?.(event);
            },
            onKeydown(event) {
                if (event.key === 'ArrowDown') {
                    event.preventDefault();
                    popover.open();
                    void nextTick(elements.focusCalendar);
                } else if (event.key === 'Escape') {
                    trigger.onKeydown(event);
                }
                attrs.onKeydown?.(event);
            },
        };
    }

    function focusInput() {
        elements.getInput()?.focus({ preventScroll: true });
    }

    function focusInputWithoutOpening() {
        suppressFocusOpen = true;
        try {
            focusInput();
        } finally {
            suppressFocusOpen = false;
        }
    }

    function onCalendarKeydown(event: KeyboardEvent) {
        if (event.key !== 'Escape') return;
        event.stopPropagation();
        focusInputWithoutOpening();
        closePicker?.();
    }

    function onFocusOut(event: FocusEvent) {
        if (isNodeWithinElement(event.relatedTarget, event.currentTarget)) return;
        closePicker?.();
    }

    function selectCalendarDate(value: Date) {
        if (!valueState.selectDate(value)) return;
        if (props.closeOnSelect === false) return;
        focusInputWithoutOpening();
        closePicker?.();
    }

    function clearFromControl(event: MouseEvent) {
        const clearButton = event.currentTarget;
        const shouldRestoreFocus =
            clearButton instanceof HTMLElement &&
            clearButton.ownerDocument.activeElement === clearButton;
        valueState.clear();
        if (shouldRestoreFocus) focusInputWithoutOpening();
    }

    function openDatePicker() {
        focusInputWithoutOpening();
        openPicker?.();
    }

    function onOpenUpdate(open: boolean) {
        emit.open(open);
    }

    return {
        control,
        selectedDate,
        inputValue,
        isInvalid,
        effectiveValidationMessage,
        rootClass,
        canClear,
        getInputTriggerAttrs,
        onInputUpdate,
        onCalendarKeydown,
        onFocusOut,
        clearFromControl,
        selectCalendarDate,
        openDatePicker,
        onOpenUpdate,
    };
}
