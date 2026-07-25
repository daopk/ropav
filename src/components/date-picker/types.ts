import type { InputHTMLAttributes } from 'vue';
import type { StylesApiProps } from '../../styles-api';
import type {
    CalendarDaySlotProps,
    CalendarDisabledDates,
    CalendarRadius,
    CalendarSize,
    CalendarWeekdayFormat,
} from '../calendar/types';
import type { InputRadius, InputSize } from '../input/types';
import type { PopoverPlacement } from '../popover/types';

export const datePickerParts = [
    'root',
    'control',
    'input',
    'clear',
    'indicator',
    'content',
    'calendar',
    'calendarHeader',
    'calendarControl',
    'calendarMonthLabel',
    'calendarWeekdays',
    'calendarWeekday',
    'calendarGrid',
    'calendarWeek',
    'calendarDayCell',
    'calendarDay',
] as const;

export type DatePickerPart = (typeof datePickerParts)[number];
export type DatePickerFormat = (date: Date) => string;
export type DatePickerParse = (value: string) => Date | null;
export type DatePickerDaySlotProps = CalendarDaySlotProps;

export interface DatePickerProps extends StylesApiProps<DatePickerPart> {
    id?: string;
    name?: string;
    form?: string;
    modelValue?: Date | null;
    defaultValue?: Date | null;
    defaultMonth?: Date;
    open?: boolean;
    locale?: string;
    dateFormat?: Intl.DateTimeFormatOptions;
    formatDate?: DatePickerFormat;
    parseDate?: DatePickerParse;
    firstDayOfWeek?: number;
    weekdayFormat?: CalendarWeekdayFormat;
    min?: Date;
    max?: Date;
    disabledDates?: CalendarDisabledDates;
    fixedWeeks?: boolean;
    hideOutsideDates?: boolean;
    allowInput?: boolean;
    clearable?: boolean;
    closeOnSelect?: boolean;
    disabled?: boolean;
    readonly?: boolean;
    required?: boolean;
    invalid?: boolean;
    valid?: boolean;
    size?: InputSize;
    radius?: InputRadius;
    calendarSize?: CalendarSize;
    calendarRadius?: CalendarRadius;
    placeholder?: string;
    ariaLabel?: string;
    describedby?: string;
    labelledby?: string;
    inputAttrs?: InputHTMLAttributes;
    validationMessage?: string;
    invalidDateMessage?: string;
    clearLabel?: string;
    toggleLabel?: string;
    calendarAriaLabel?: string;
    previousLabel?: string;
    nextLabel?: string;
    placement?: PopoverPlacement;
    keepMounted?: boolean;
    popoverId?: string;
}
