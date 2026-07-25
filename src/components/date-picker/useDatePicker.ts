import {
    computed,
    nextTick,
    shallowRef,
    watch,
    type ComputedRef,
    type InputHTMLAttributes,
    type ShallowRef,
} from 'vue';
import { useControllableValue } from '@/composables/useControllableValue';
import { useFormControl } from '@/internal/composables/useFormControl';
import { useControlState } from '@/internal/composables/useControlState';
import { bem } from '@/utils/bem';
import { normalizeDate, toLocalDate } from '@/utils/date';
import { isDateUnavailable } from '@/utils/dateAvailability';
import { isNodeWithinElement } from '@/utils/dom/events';
import type { PopoverSlotProps } from '../popover/types';
import {
    defaultDatePickerFormat,
    formatDatePickerValue,
    normalizeDatePickerValue,
    parseDatePickerValue,
} from './datePickerModel';
import type { DatePickerProps } from './types';

interface DatePickerEmitters {
    value: (value: Date | null) => void;
    change: (value: Date | null) => void;
    open: (open: boolean) => void;
}

interface DatePickerElements {
    getInput: () => HTMLInputElement | null;
    focusCalendar: () => void;
}

function isDatePickerInputEditable(props: Readonly<DatePickerProps>, disabled: boolean) {
    return Boolean(props.allowInput && !disabled && !props.readonly);
}

function isDatePickerDateUnavailable(date: Date, props: Readonly<DatePickerProps>) {
    return isDateUnavailable(date, {
        min: props.min,
        max: props.max,
        disabledDates: props.disabledDates,
    });
}

function watchDatePickerInput(
    props: Readonly<DatePickerProps>,
    selectedDate: ComputedRef<Date | null>,
    inputValue: ShallowRef<string>,
    hasInvalidInput: ShallowRef<boolean>,
    formatValue: (value: Date | null) => string,
) {
    watch(
        [
            () => selectedDate.value?.getTime(),
            () => props.locale,
            () => props.dateFormat,
            () => props.formatDate,
        ],
        () => {
            inputValue.value = formatValue(selectedDate.value);
            hasInvalidInput.value = false;
        },
        { flush: 'sync' },
    );
}

export function useDatePicker(
    props: Readonly<DatePickerProps>,
    emit: DatePickerEmitters,
    elements: DatePickerElements,
) {
    const control = useControlState(props);
    const initialValue = normalizeDatePickerValue(props.defaultValue);
    const controllable = useControllableValue<Date | null>({
        modelValue: () => props.modelValue,
        defaultValue: () => initialValue,
        onChange(value) {
            const normalized = normalizeDate(value);
            emit.value(normalized);
            emit.change(normalized);
        },
    });
    const selectedDate = computed(() => normalizeDatePickerValue(controllable.value.value));
    const inputValue = shallowRef(formatValue(selectedDate.value));
    const hasInvalidInput = shallowRef(false);
    const isInvalid = computed(() => control.invalid || hasInvalidInput.value);
    const effectiveValidationMessage = computed(() => {
        if (props.validationMessage !== undefined) return props.validationMessage;
        return hasInvalidInput.value ? props.invalidDateMessage : undefined;
    });
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
    const canClear = computed(
        () =>
            Boolean(props.clearable && selectedDate.value) && !control.disabled && !props.readonly,
    );
    let openPicker: PopoverSlotProps['open'] | undefined;
    let closePicker: PopoverSlotProps['close'] | undefined;
    let suppressFocusOpen = false;
    let pointerDownStartedFocused: boolean | undefined;

    watchDatePickerInput(props, selectedDate, inputValue, hasInvalidInput, formatValue);

    function formatValue(value: Date | null) {
        if (!value) return '';
        return (
            props.formatDate?.(toLocalDate(value)) ??
            formatDatePickerValue(value, props.locale, props.dateFormat ?? defaultDatePickerFormat)
        );
    }

    function parseValue(value: string) {
        const parsed = props.parseDate
            ? props.parseDate(value)
            : parseDatePickerValue(
                  value,
                  props.locale,
                  props.dateFormat ?? defaultDatePickerFormat,
              );
        return normalizeDate(parsed);
    }

    function reconcileControlledInput() {
        if (!controllable.isControlled.value) return false;
        void nextTick(() => {
            inputValue.value = formatValue(selectedDate.value);
        });
        return true;
    }

    function setSelectedDate(value: Date | null) {
        const normalized = normalizeDate(value);
        controllable.setValue(normalized);
        if (!reconcileControlledInput()) inputValue.value = formatValue(normalized);
        hasInvalidInput.value = false;
    }

    function onInputUpdate(value: string) {
        if (!props.allowInput || control.disabled || props.readonly) return;
        inputValue.value = value;

        if (!value.trim()) {
            setSelectedDate(null);
            return;
        }

        const parsed = parseValue(value);
        hasInvalidInput.value = !parsed || isDatePickerDateUnavailable(parsed, props);
        if (!hasInvalidInput.value && parsed) {
            controllable.setValue(parsed);
            reconcileControlledInput();
        }
    }

    function onInputBlur() {
        if (!props.allowInput || !inputValue.value.trim()) return;
        if (inputValue.value === formatValue(selectedDate.value)) {
            hasInvalidInput.value = false;
            return;
        }
        const parsed = parseValue(inputValue.value);
        hasInvalidInput.value = !parsed || isDatePickerDateUnavailable(parsed, props);
        if (!hasInvalidInput.value && parsed) inputValue.value = formatValue(parsed);
    }

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
            'aria-readonly': isDatePickerInputEditable(props, control.disabled)
                ? attrs['aria-readonly']
                : true,
            autocomplete: attrs.autocomplete ?? 'off',
            inputmode: isDatePickerInputEditable(props, control.disabled)
                ? attrs.inputmode
                : 'none',
            onBeforeinput(event) {
                if (!isDatePickerInputEditable(props, control.disabled)) event.preventDefault();
                attrs.onBeforeinput?.(event);
            },
            onInput(event) {
                if (
                    !isDatePickerInputEditable(props, control.disabled) &&
                    event.currentTarget instanceof HTMLInputElement
                ) {
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
        if (control.disabled || props.readonly) return;
        setSelectedDate(value);
        if (props.closeOnSelect === false) return;
        focusInputWithoutOpening();
        closePicker?.();
    }

    function clearSelection() {
        if (!canClear.value) return;
        setSelectedDate(null);
    }

    function clearFromControl(event: MouseEvent) {
        const clearButton = event.currentTarget;
        const shouldRestoreFocus =
            clearButton instanceof HTMLElement &&
            clearButton.ownerDocument.activeElement === clearButton;
        clearSelection();
        if (shouldRestoreFocus) focusInputWithoutOpening();
    }

    function openDatePicker() {
        focusInputWithoutOpening();
        openPicker?.();
    }

    function resetValue() {
        controllable.resetValue(initialValue);
        inputValue.value = formatValue(initialValue);
        hasInvalidInput.value = false;
    }

    function onOpenUpdate(open: boolean) {
        emit.open(open);
    }

    useFormControl({
        elements: () => [elements.getInput()],
        isControlled: () => controllable.isControlled.value,
        initializeDefault(element) {
            (element as HTMLInputElement).defaultValue = formatValue(initialValue);
        },
        validationMessage: () => effectiveValidationMessage.value,
        readResetValue: resetValue,
        syncControlledValue([element]) {
            element.value = inputValue.value;
        },
    });

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
