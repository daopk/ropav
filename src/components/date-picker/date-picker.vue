<template>
    <Popover
        v-bind="rootAttrs"
        :id="popoverId"
        :class-names="popoverClassNames"
        :styles="popoverStyles"
        :placement="placement"
        :open="open"
        :keep-mounted="keepMounted"
        :disabled="popoverDisabled"
        :aria-label="calendarAriaLabel"
        :content-class="`rp-date-picker__popover rp-date-picker__popover--size-${calendarSize ?? size ?? 'md'}`"
        @update:open="onOpenUpdate"
    >
        <template #default="slotProps">
            <Input
                ref="inputComponentRef"
                :id="control.id"
                :name="name"
                :form="control.form"
                :model-value="inputValue"
                type="text"
                :size="size"
                :radius="radius"
                :placeholder="placeholder"
                :disabled="control.disabled || undefined"
                :readonly="readonly || undefined"
                :required="control.required || undefined"
                :invalid="isInvalid || undefined"
                :valid="control.valid && !isInvalid ? true : undefined"
                :aria-label="ariaLabel"
                :describedby="describedby"
                :labelledby="labelledby"
                :input-attrs="getInputTriggerAttrs(slotProps)"
                :class-names="inputClassNames"
                :styles="inputStyles"
                :validation-message="effectiveValidationMessage"
                @update:model-value="onInputUpdate"
            >
                <template #right>
                    <button
                        v-if="clearable"
                        v-bind="
                            getPartAttrs('clear', {
                                class: [
                                    'rp-date-picker__clear',
                                    { 'rp-date-picker__clear--hidden': !canClear },
                                ],
                            })
                        "
                        type="button"
                        :aria-label="clearLabel"
                        :aria-hidden="!canClear ? 'true' : undefined"
                        :disabled="!canClear || undefined"
                        @mousedown.prevent
                        @click.stop="clearFromControl"
                    >
                        <slot name="clear-icon">
                            <IconX aria-hidden="true" />
                        </slot>
                    </button>
                    <button
                        v-if="$slots['calendar-icon']"
                        v-bind="getIndicatorAttrs(slotProps)"
                        type="button"
                        :disabled="popoverDisabled"
                        :aria-label="toggleLabel"
                        :aria-expanded="slotProps.isOpen"
                        aria-haspopup="dialog"
                        @mousedown.prevent
                        @click.stop="openDatePicker"
                    >
                        <slot name="calendar-icon" />
                    </button>
                </template>
            </Input>
        </template>

        <template #content="slotProps">
            <Calendar
                :model-value="selectedDate"
                :default-month="defaultMonth"
                :locale="locale"
                :first-day-of-week="firstDayOfWeek"
                :weekday-format="weekdayFormat"
                :min="min"
                :max="max"
                :disabled-dates="disabledDates"
                :fixed-weeks="fixedWeeks"
                :hide-outside-dates="hideOutsideDates"
                :readonly="readonly"
                :size="calendarSize ?? size"
                :radius="calendarRadius ?? radius"
                :aria-label="calendarAriaLabel"
                :previous-label="previousLabel"
                :next-label="nextLabel"
                :class-names="calendarClassNames"
                :styles="calendarStyles"
                @focusin="rememberClose(slotProps)"
                @keydown="onCalendarKeydown($event, slotProps)"
                @update:model-value="selectCalendarDate($event, slotProps.close)"
            >
                <template v-if="$slots.day" #day="dayProps">
                    <slot name="day" v-bind="dayProps" />
                </template>
                <template v-if="$slots['previous-icon']" #previous-icon>
                    <slot name="previous-icon" />
                </template>
                <template v-if="$slots['next-icon']" #next-icon>
                    <slot name="next-icon" />
                </template>
            </Calendar>
        </template>
    </Popover>
</template>

<script lang="ts" setup vapor>
import { computed, ref } from 'vue';
import IconX from '~icons/lucide/x';
import {
    provideNestedFormControlOwner,
    useFormControl,
} from '@/internal/composables/useFormControl';
import { useStylesApi } from '@/styles-api';
import { toPresenceAttribute } from '@/utils/attributes';
import Calendar from '../calendar/calendar.vue';
import Input from '../input/input.vue';
import Popover from '../popover/popover.vue';
import type { PopoverSlotProps } from '../popover/types';
import type { DatePickerDaySlotProps, DatePickerPart, DatePickerProps } from './types';
import { defaultDatePickerFormat } from './datePickerModel';
import { useDatePicker } from './useDatePicker';
import { useDatePickerPopover } from './useDatePickerPopover';

defineOptions({ name: 'RpDatePicker', inheritAttrs: false });

const props = withDefaults(defineProps<DatePickerProps>(), {
    modelValue: undefined,
    defaultValue: null,
    open: undefined,
    locale: undefined,
    dateFormat: () => ({ ...defaultDatePickerFormat }),
    formatDate: undefined,
    parseDate: undefined,
    firstDayOfWeek: 0,
    weekdayFormat: 'short',
    fixedWeeks: true,
    hideOutsideDates: false,
    allowInput: false,
    clearable: true,
    closeOnSelect: true,
    disabled: undefined,
    readonly: false,
    required: undefined,
    invalid: undefined,
    valid: undefined,
    placeholder: 'Select date',
    calendarSize: undefined,
    calendarRadius: undefined,
    validationMessage: undefined,
    invalidDateMessage: 'Enter a valid date.',
    clearLabel: 'Clear date',
    toggleLabel: 'Open calendar',
    calendarAriaLabel: 'Choose a date',
    previousLabel: 'Previous month',
    nextLabel: 'Next month',
    placement: 'bottom-start',
    keepMounted: false,
});

const emit = defineEmits<{
    'update:modelValue': [value: Date | null];
    'update:open': [open: boolean];
    change: [value: Date | null];
}>();

defineSlots<{
    day?(props: DatePickerDaySlotProps): unknown;
    'clear-icon'?(): unknown;
    'calendar-icon'?(): unknown;
    'previous-icon'?(): unknown;
    'next-icon'?(): unknown;
}>();

provideNestedFormControlOwner();
const inputComponentRef = ref<{ nativeElement: HTMLInputElement | null; focus: () => void } | null>(
    null,
);
const {
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
    onInputUpdate,
    onInputBlur,
    onCalendarUpdate,
    clearSelection,
    resetValue,
    onOpenUpdate,
} = useDatePicker(props, {
    value: (value) => emit('update:modelValue', value),
    change: (value) => emit('change', value),
    open: (open) => emit('update:open', open),
});
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
    isInputEditable: () => props.allowInput && !control.disabled && !props.readonly,
    onInputBlur,
});
const popoverDisabled = computed(() => control.disabled || props.readonly);

useFormControl({
    elements: () => [inputComponentRef.value?.nativeElement],
    isControlled: () => controllable.isControlled.value,
    initializeDefault(element) {
        (element as HTMLInputElement).defaultValue = formatValue(initialValue);
    },
    validationMessage: () => effectiveValidationMessage.value,
    readResetValue() {
        resetValue();
    },
    syncControlledValue([element]) {
        element.value = inputValue.value;
    },
});

const { getPartAttrs, getRootAttrs } = useStylesApi<DatePickerPart>(props, 'root');
const rootAttrs = computed(() =>
    getRootAttrs({
        'data-disabled': toPresenceAttribute(control.disabled),
        'data-readonly': toPresenceAttribute(props.readonly),
        'data-invalid': toPresenceAttribute(isInvalid.value),
        onFocusout: onFocusOut,
    }),
);
const popoverClassNames = computed(() => ({
    root: rootClass.value,
    content: props.classNames?.content,
}));
const popoverStyles = computed(() => ({ content: props.styles?.content }));
const inputClassNames = computed(() => ({
    root: props.classNames?.control,
    input: props.classNames?.input,
}));
const inputStyles = computed(() => ({
    root: props.styles?.control,
    input: props.styles?.input,
}));
const calendarClassNames = computed(() => ({
    root: props.classNames?.calendar,
    header: props.classNames?.calendarHeader,
    previousControl: props.classNames?.calendarControl,
    nextControl: props.classNames?.calendarControl,
    monthLabel: props.classNames?.calendarMonthLabel,
    weekdays: props.classNames?.calendarWeekdays,
    weekday: props.classNames?.calendarWeekday,
    grid: props.classNames?.calendarGrid,
    week: props.classNames?.calendarWeek,
    dayCell: props.classNames?.calendarDayCell,
    day: props.classNames?.calendarDay,
}));
const calendarStyles = computed(() => ({
    root: props.styles?.calendar,
    header: props.styles?.calendarHeader,
    previousControl: props.styles?.calendarControl,
    nextControl: props.styles?.calendarControl,
    monthLabel: props.styles?.calendarMonthLabel,
    weekdays: props.styles?.calendarWeekdays,
    weekday: props.styles?.calendarWeekday,
    grid: props.styles?.calendarGrid,
    week: props.styles?.calendarWeek,
    dayCell: props.styles?.calendarDayCell,
    day: props.styles?.calendarDay,
}));

function getIndicatorAttrs(slotProps: unknown) {
    const popover = slotProps as PopoverSlotProps;
    return {
        ...getPartAttrs('indicator', { class: 'rp-date-picker__indicator' }),
        'aria-controls': popover.triggerProps['aria-controls'],
    };
}

function focusInputWithoutOpening() {
    focusWithoutOpening(() => inputComponentRef.value?.focus());
}

function clearFromControl(event: MouseEvent) {
    const clearButton = event.currentTarget;
    const shouldRestoreFocus =
        clearButton instanceof HTMLElement &&
        clearButton.ownerDocument.activeElement === clearButton;
    clearSelection();
    if (shouldRestoreFocus) focusInputWithoutOpening();
}

function selectCalendarDate(value: Date, close: () => void) {
    onCalendarUpdate(value, () => {
        focusInputWithoutOpening();
        close();
    });
}

function openDatePicker() {
    focusInputWithoutOpening();
    openPopover();
}

defineExpose({
    nativeElement: computed(() => inputComponentRef.value?.nativeElement ?? null),
    focus: () => inputComponentRef.value?.focus(),
    open: openDatePicker,
});
</script>

<style src="./date-picker.scss" lang="scss" scoped></style>
