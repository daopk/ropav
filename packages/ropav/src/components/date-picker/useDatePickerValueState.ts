import { computed, nextTick, shallowRef, watch } from 'vue';
import { useControllableValue } from '@/composables/useControllableValue';
import { useControlState } from '@/internal/composables/useControlState';
import { useFormControl } from '@/internal/composables/useFormControl';
import { normalizeDate, toLocalDate } from '@/utils/date';
import { isDateUnavailable } from '@/utils/dateAvailability';
import {
    defaultDatePickerFormat,
    formatDatePickerValue,
    normalizeDatePickerValue,
    parseDatePickerValue,
} from './datePickerModel';
import type { DatePickerProps } from './types';

export type DatePickerValueStateProps = Pick<
    DatePickerProps,
    | 'id'
    | 'form'
    | 'modelValue'
    | 'defaultValue'
    | 'locale'
    | 'dateFormat'
    | 'formatDate'
    | 'parseDate'
    | 'min'
    | 'max'
    | 'disabledDates'
    | 'allowInput'
    | 'clearable'
    | 'disabled'
    | 'readonly'
    | 'required'
    | 'invalid'
    | 'valid'
    | 'describedby'
    | 'labelledby'
    | 'validationMessage'
    | 'invalidDateMessage'
>;

interface DatePickerValueStateOptions {
    props: Readonly<DatePickerValueStateProps>;
    getInput: () => HTMLInputElement | null;
    onChange: (value: Date | null) => void;
}

export function useDatePickerValueState(options: Readonly<DatePickerValueStateOptions>) {
    const { props } = options;
    const control = useControlState(props);
    const initialValue = normalizeDatePickerValue(props.defaultValue);
    const controllable = useControllableValue<Date | null>({
        modelValue: () => props.modelValue,
        defaultValue: () => initialValue,
        onChange(value) {
            options.onChange(normalizeDate(value));
        },
    });
    const selectedDate = computed(() => normalizeDatePickerValue(controllable.value.value));
    const inputValue = shallowRef(formatValue(selectedDate.value));
    const hasInvalidInput = shallowRef(false);
    const isInputEditable = computed(
        () => Boolean(props.allowInput) && !control.disabled && !props.readonly,
    );
    const isInvalid = computed(() => control.invalid || hasInvalidInput.value);
    const validationMessage = computed(() => {
        if (props.validationMessage !== undefined) return props.validationMessage;
        return hasInvalidInput.value ? props.invalidDateMessage : undefined;
    });
    const canClear = computed(
        () =>
            Boolean(props.clearable && selectedDate.value) && !control.disabled && !props.readonly,
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

    function isUnavailable(date: Date) {
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

    function updateInput(value: string) {
        if (!isInputEditable.value) return;
        inputValue.value = value;

        if (!value.trim()) {
            setSelectedDate(null);
            return;
        }

        const parsed = parseValue(value);
        hasInvalidInput.value = !parsed || isUnavailable(parsed);
        if (!hasInvalidInput.value && parsed) {
            controllable.setValue(parsed);
            reconcileControlledInput();
        }
    }

    function blurInput() {
        if (!props.allowInput || !inputValue.value.trim()) return;
        if (inputValue.value === formatValue(selectedDate.value)) {
            hasInvalidInput.value = false;
            return;
        }

        const parsed = parseValue(inputValue.value);
        hasInvalidInput.value = !parsed || isUnavailable(parsed);
        if (!hasInvalidInput.value && parsed) inputValue.value = formatValue(parsed);
    }

    function selectDate(value: Date) {
        if (control.disabled || props.readonly) return false;
        setSelectedDate(value);
        return true;
    }

    function clear() {
        if (!canClear.value) return false;
        setSelectedDate(null);
        return true;
    }

    function resetValue() {
        controllable.resetValue(initialValue);
        inputValue.value = formatValue(initialValue);
        hasInvalidInput.value = false;
    }

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

    useFormControl({
        elements: () => [options.getInput()],
        isControlled: () => controllable.isControlled.value,
        initializeDefault(element) {
            (element as HTMLInputElement).defaultValue = formatValue(initialValue);
        },
        validationMessage: () => validationMessage.value,
        readResetValue: resetValue,
        syncControlledValue([element]) {
            element.value = inputValue.value;
        },
    });

    return {
        control,
        selectedDate,
        inputValue,
        isInputEditable,
        isInvalid,
        validationMessage,
        canClear,
        updateInput,
        blurInput,
        selectDate,
        clear,
    };
}
