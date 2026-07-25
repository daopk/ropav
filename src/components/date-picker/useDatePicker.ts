import { computed, nextTick, shallowRef, watch } from 'vue';
import { useControllableValue } from '@/composables/useControllableValue';
import { useControlState } from '@/internal/composables/useControlState';
import { bem } from '@/utils/bem';
import { normalizeDate, toLocalDate } from '@/utils/date';
import { isCalendarDateDisabled } from '../calendar/calendarModel';
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

export function useDatePicker(props: Readonly<DatePickerProps>, emit: DatePickerEmitters) {
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
        return isCalendarDateDisabled(date, {
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

    function onCalendarUpdate(value: Date, close: () => void) {
        if (control.disabled || props.readonly) return;
        setSelectedDate(value);
        if (props.closeOnSelect !== false) close();
    }

    function clearSelection() {
        if (!canClear.value) return;
        setSelectedDate(null);
    }

    function resetValue() {
        controllable.resetValue(initialValue);
        inputValue.value = formatValue(initialValue);
        hasInvalidInput.value = false;
    }

    function onOpenUpdate(open: boolean) {
        emit.open(open);
    }

    return {
        control,
        controllable,
        initialValue,
        selectedDate,
        inputValue,
        isInvalid,
        effectiveValidationMessage,
        rootClass,
        canClear,
        formatValue,
        setSelectedDate,
        onInputUpdate,
        onInputBlur,
        onCalendarUpdate,
        clearSelection,
        resetValue,
        onOpenUpdate,
    };
}
