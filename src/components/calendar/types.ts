import type { StylesApiProps } from '../../styles-api';

export const calendarParts = [
    'root',
    'header',
    'previousControl',
    'monthLabel',
    'nextControl',
    'weekdays',
    'weekday',
    'grid',
    'week',
    'dayCell',
    'day',
] as const;

export const calendarSizes = ['xs', 'sm', 'md', 'lg', 'xl'] as const;
export const calendarRadiuses = ['none', 'xs', 'sm', 'md', 'lg', 'xl', 'full'] as const;
export const calendarWeekdayFormats = ['narrow', 'short', 'long'] as const;

export type CalendarPart = (typeof calendarParts)[number];
export type CalendarSize = (typeof calendarSizes)[number];
export type CalendarRadius = (typeof calendarRadiuses)[number];
export type CalendarWeekdayFormat = (typeof calendarWeekdayFormats)[number];
export type CalendarDisabledDates = readonly Date[] | ((date: Date) => boolean);

export interface CalendarDay {
    date: Date;
    key: string;
    label: number;
    outside: boolean;
    hidden: boolean;
    selected: boolean;
    today: boolean;
    disabled: boolean;
}

export interface CalendarWeekday {
    key: number;
    label: string;
    ariaLabel: string;
}

export interface CalendarDaySlotProps extends CalendarDay {
    select: () => void;
}

export interface CalendarProps extends StylesApiProps<CalendarPart> {
    id?: string;
    modelValue?: Date | null;
    defaultValue?: Date | null;
    month?: Date;
    defaultMonth?: Date;
    locale?: string;
    firstDayOfWeek?: number;
    weekdayFormat?: CalendarWeekdayFormat;
    monthFormat?: Intl.DateTimeFormatOptions;
    min?: Date;
    max?: Date;
    disabledDates?: CalendarDisabledDates;
    fixedWeeks?: boolean;
    hideOutsideDates?: boolean;
    disabled?: boolean;
    readonly?: boolean;
    size?: CalendarSize;
    radius?: CalendarRadius;
    ariaLabel?: string;
    previousLabel?: string;
    nextLabel?: string;
}
