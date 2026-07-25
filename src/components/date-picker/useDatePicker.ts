import { computed, nextTick, shallowRef, watch } from 'vue';
import { useControllableValue } from '@/composables/useControllableValue';
import { useFormControl } from '@/internal/composables/useFormControl';
import { useControlState } from '@/internal/composables/useControlState';
import { bem } from '@/utils/bem';
import { normalizeDate, toLocalDate } from '@/utils/date';
import { isDateUnavailable } from '@/utils/dateAvailability';
import {
    defaultDatePickerFormat,
    formatDatePickerValue,
    normalizeDatePickerValue,
    parseDatePickerValue,
} from './datePickerModel';
import type { DatePickerProps } from './types';
import { useDatePickerPopover } from './useDatePickerPopover';

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
    const {
        getInputTriggerAttrs,
        open: openPopover,
        focusWithoutOpening,
        rememberClose,
        onCalendarKeydown,
        onFocusOut,
    } = useDatePickerPopover({
        getInputAttrs: () => props.inputAttrs,
        getInputValue: () => inputValue.value,
        isInputEditable: () => Boolean(props.allowInput && !control.disabled && !props.readonly),
        onInputBlur,
        focusInput,
        focusCalendar: elements.focusCalendar,
    });

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

    function dateIsDisabled(date: Date) {
        return isDateUnavailable(date, {
            min: props.min,
            max: props.max,
            disabledDates: props.disabledDates,
        });
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
        hasInvalidInput.value = !parsed || dateIsDisabled(parsed);
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
        hasInvalidInput.value = !parsed || dateIsDisabled(parsed);
        if (!hasInvalidInput.value && parsed) inputValue.value = formatValue(parsed);
    }

    function focusInput() {
        elements.getInput()?.focus({ preventScroll: true });
    }

    function focusInputWithoutOpening() {
        focusWithoutOpening(focusInput);
    }

    function selectCalendarDate(value: Date, close: () => void) {
        if (control.disabled || props.readonly) return;
        setSelectedDate(value);
        if (props.closeOnSelect === false) return;
        focusInputWithoutOpening();
        close();
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
        openPopover();
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
        rememberClose,
        onCalendarKeydown,
        onFocusOut,
        clearFromControl,
        selectCalendarDate,
        openDatePicker,
        onOpenUpdate,
    };
}
