import {
    addCalendarDays,
    addCalendarMonths,
    addCalendarYears,
    compareDates,
    endOfMonth,
    isSameDate,
    isSameMonth,
    normalizeDate,
    startOfMonth,
    toDateKey,
    toLocalDate,
} from '@/utils/date';
import { isDateUnavailable, type DateAvailabilityOptions } from '@/utils/dateAvailability';
import type { CalendarDay, CalendarWeekday, CalendarWeekdayFormat } from './types';

type SearchDirection = 1 | -1;

interface CalendarBehaviorOptions extends DateAvailabilityOptions {
    month: Date;
    selectedDate: Date | null;
    today: Date;
    firstDayOfWeek?: number;
    weekdayFormat?: CalendarWeekdayFormat;
    locale?: string;
    monthFormat?: Intl.DateTimeFormatOptions;
    fixedWeeks?: boolean;
    hideOutsideDates?: boolean;
    disabled?: boolean;
}

type CalendarBehaviorAction =
    | { type: 'resolve-focusable'; focusedDate: Date }
    | { type: 'align-month'; previousMonth: Date; focusedDate: Date }
    | { type: 'navigate-month'; amount: number; focusedDate: Date }
    | { type: 'move-focus'; date: Date; key: string; shiftKey?: boolean };

interface CalendarBehaviorTransition {
    focusedDate: Date;
    visibleMonth?: Date;
}

interface CalendarBehaviorView {
    days: CalendarDay[];
    weeks: CalendarDay[][];
    weekdays: CalendarWeekday[];
    monthLabel: string;
    previousDisabled: boolean;
    nextDisabled: boolean;
}

interface CalendarBehavior {
    view: CalendarBehaviorView;
    decide: (action: CalendarBehaviorAction) => CalendarBehaviorTransition | null;
}

interface CalendarDecisionContext {
    month: Date;
    selectedDate: Date | null;
    today: Date;
    firstDayOfWeek: number;
    disabled: boolean;
    availability: DateAvailabilityOptions;
    visibleDays: CalendarDay[];
}

interface EnabledDateSearch {
    candidate: Date;
    direction: SearchDirection;
    min?: Date;
    max?: Date;
    availability: DateAvailabilityOptions;
}

interface PreferredDateOptions {
    month: Date;
    anchor: Date;
    selectedDate: Date | null;
    today: Date;
    direction: SearchDirection;
    availability: DateAvailabilityOptions;
}

function normalizeFirstDayOfWeek(value: number | undefined): number {
    if (!Number.isFinite(value)) return 0;
    return ((Math.trunc(value as number) % 7) + 7) % 7;
}

function createCalendarDays(
    options: CalendarBehaviorOptions,
    firstDayOfWeek: number,
): CalendarDay[] {
    const month = startOfMonth(options.month);
    const leadingDays = (month.getDay() - firstDayOfWeek + 7) % 7;
    const gridStart = addCalendarDays(month, -leadingDays);
    const requiredDays = leadingDays + endOfMonth(month).getDate();
    const dayCount = (options.fixedWeeks ?? true) ? 42 : Math.ceil(requiredDays / 7) * 7;
    const dayFormatter = new Intl.DateTimeFormat(options.locale, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    return Array.from({ length: dayCount }, (_, index) => {
        const date = addCalendarDays(gridStart, index);
        const outside = !isSameMonth(date, month);

        return {
            date,
            key: toDateKey(date),
            label: date.getDate(),
            ariaLabel: dayFormatter.format(date),
            outside,
            hidden: outside && Boolean(options.hideOutsideDates),
            selected: isSameDate(date, options.selectedDate),
            today: isSameDate(date, options.today),
            disabled: isDateUnavailable(date, options),
        };
    });
}

function createCalendarWeeks(days: readonly CalendarDay[]): CalendarDay[][] {
    const weeks: CalendarDay[][] = [];
    for (let index = 0; index < days.length; index += 7) {
        weeks.push(days.slice(index, index + 7));
    }
    return weeks;
}

function getCalendarWeekdays(
    locale: string | undefined,
    firstDayOfWeek: number,
    format: CalendarWeekdayFormat,
): CalendarWeekday[] {
    const shortFormatter = new Intl.DateTimeFormat(locale, {
        weekday: format,
        timeZone: 'UTC',
    });
    const longFormatter = new Intl.DateTimeFormat(locale, {
        weekday: 'long',
        timeZone: 'UTC',
    });

    return Array.from({ length: 7 }, (_, index) => {
        const weekday = (firstDayOfWeek + index) % 7;
        const date = new Date(Date.UTC(2021, 7, 1 + weekday));
        return {
            key: weekday,
            label: shortFormatter.format(date),
            ariaLabel: longFormatter.format(date),
        };
    });
}

function monthHasSelectableDate(month: Date, availability: DateAvailabilityOptions) {
    const first = startOfMonth(month);
    const last = endOfMonth(month);
    for (let date = first; date <= last; date = addCalendarDays(date, 1)) {
        if (!isDateUnavailable(date, availability)) return true;
    }
    return false;
}

function monthIntersectsBounds(month: Date, availability: DateAvailabilityOptions) {
    const min = normalizeDate(availability.min);
    const max = normalizeDate(availability.max);
    return (
        (!min || compareDates(endOfMonth(month), min) >= 0) &&
        (!max || compareDates(startOfMonth(month), max) <= 0)
    );
}

function findNavigableMonth(
    requestedMonth: Date,
    direction: SearchDirection,
    availability: DateAvailabilityOptions,
): Date | null {
    const min = normalizeDate(availability.min);
    const max = normalizeDate(availability.max);
    const hasDirectionalBound = direction === 1 ? Boolean(max) : Boolean(min);
    let candidate = startOfMonth(requestedMonth);

    if (direction === 1 && min && compareDates(endOfMonth(candidate), min) < 0) {
        candidate = startOfMonth(min);
    } else if (direction === -1 && max && compareDates(startOfMonth(candidate), max) > 0) {
        candidate = startOfMonth(max);
    }

    while (monthIntersectsBounds(candidate, availability)) {
        if (monthHasSelectableDate(candidate, availability)) return candidate;

        const followingMonth = addCalendarMonths(candidate, direction);
        if (!monthIntersectsBounds(followingMonth, availability)) return null;

        // A predicate can describe an unbounded run of unavailable months. Keep traversal
        // possible instead of trying to prove that no future selectable date exists.
        if (typeof availability.disabledDates === 'function' && !hasDirectionalBound) {
            return candidate;
        }
        candidate = followingMonth;
    }

    return null;
}

function findEnabledDate(search: EnabledDateSearch): Date | null {
    let current = search.candidate;
    for (let index = 0; index < 3660; index += 1) {
        if (search.min && compareDates(current, search.min) < 0) return null;
        if (search.max && compareDates(current, search.max) > 0) return null;
        if (!isDateUnavailable(current, search.availability)) return current;
        current = addCalendarDays(current, search.direction);
    }
    return null;
}

function findEnabledDateInMonth(
    candidate: Date,
    direction: SearchDirection,
    availability: DateAvailabilityOptions,
) {
    const min = startOfMonth(candidate);
    const max = endOfMonth(candidate);
    return (
        findEnabledDate({ candidate, direction, min, max, availability }) ??
        findEnabledDate({
            candidate: addCalendarDays(candidate, -direction),
            direction: direction === 1 ? -1 : 1,
            min,
            max,
            availability,
        })
    );
}

function getPreferredDateForMonth(options: PreferredDateOptions): Date | null {
    const month = startOfMonth(options.month);
    const selected = options.selectedDate;
    if (
        selected &&
        isSameMonth(selected, month) &&
        !isDateUnavailable(selected, options.availability)
    ) {
        return selected;
    }
    if (
        isSameMonth(options.today, month) &&
        !isDateUnavailable(options.today, options.availability)
    ) {
        return options.today;
    }

    const anchor = new Date(
        month.getFullYear(),
        month.getMonth(),
        Math.min(options.anchor.getDate(), endOfMonth(month).getDate()),
    );
    return findEnabledDateInMonth(anchor, options.direction, options.availability);
}

function getKeyboardTarget(
    action: Extract<CalendarBehaviorAction, { type: 'move-focus' }>,
    firstDayOfWeek: number,
    availability: DateAvailabilityOptions,
): Date | null {
    switch (action.key) {
        case 'ArrowLeft':
            return findEnabledDate({
                candidate: addCalendarDays(action.date, -1),
                direction: -1,
                availability,
            });
        case 'ArrowRight':
            return findEnabledDate({
                candidate: addCalendarDays(action.date, 1),
                direction: 1,
                availability,
            });
        case 'ArrowUp':
            return findEnabledDate({
                candidate: addCalendarDays(action.date, -7),
                direction: -1,
                availability,
            });
        case 'ArrowDown':
            return findEnabledDate({
                candidate: addCalendarDays(action.date, 7),
                direction: 1,
                availability,
            });
        case 'Home': {
            const offset = (action.date.getDay() - firstDayOfWeek + 7) % 7;
            const min = addCalendarDays(action.date, -offset);
            return findEnabledDate({
                candidate: min,
                direction: 1,
                min,
                max: addCalendarDays(min, 6),
                availability,
            });
        }
        case 'End': {
            const offset = (firstDayOfWeek + 6 - action.date.getDay() + 7) % 7;
            const max = addCalendarDays(action.date, offset);
            return findEnabledDate({
                candidate: max,
                direction: -1,
                min: addCalendarDays(max, -6),
                max,
                availability,
            });
        }
        case 'PageUp':
            return findEnabledDateInMonth(
                action.shiftKey
                    ? addCalendarYears(action.date, -1)
                    : addCalendarMonths(action.date, -1),
                -1,
                availability,
            );
        case 'PageDown':
            return findEnabledDateInMonth(
                action.shiftKey
                    ? addCalendarYears(action.date, 1)
                    : addCalendarMonths(action.date, 1),
                1,
                availability,
            );
        default:
            return null;
    }
}

function resolveFocusableDate(
    context: CalendarDecisionContext,
    action: Extract<CalendarBehaviorAction, { type: 'resolve-focusable' }>,
): CalendarBehaviorTransition | null {
    const focusedDay = context.visibleDays.find((day) => isSameDate(day.date, action.focusedDate));
    const selectedDay = context.visibleDays.find((day) => day.selected);
    const todayDay = context.visibleDays.find((day) => day.today);
    const focusedDate =
        focusedDay?.date ??
        selectedDay?.date ??
        todayDay?.date ??
        context.visibleDays[0]?.date ??
        null;
    return focusedDate ? { focusedDate } : null;
}

function alignCalendarMonth(
    context: CalendarDecisionContext,
    action: Extract<CalendarBehaviorAction, { type: 'align-month' }>,
): CalendarBehaviorTransition | null {
    if (isSameMonth(action.focusedDate, context.month)) return null;
    const direction = compareDates(context.month, action.previousMonth) >= 0 ? 1 : -1;
    return {
        focusedDate:
            getPreferredDateForMonth({
                month: context.month,
                anchor: action.focusedDate,
                selectedDate: context.selectedDate,
                today: context.today,
                direction,
                availability: context.availability,
            }) ?? context.month,
    };
}

function navigateCalendarMonth(
    context: CalendarDecisionContext,
    action: Extract<CalendarBehaviorAction, { type: 'navigate-month' }>,
): CalendarBehaviorTransition | null {
    if (context.disabled || action.amount === 0) return null;
    const direction = action.amount > 0 ? 1 : -1;
    const visibleMonth = findNavigableMonth(
        addCalendarMonths(context.month, action.amount),
        direction,
        context.availability,
    );
    if (!visibleMonth) return null;
    return {
        visibleMonth,
        focusedDate:
            getPreferredDateForMonth({
                month: visibleMonth,
                anchor: action.focusedDate,
                selectedDate: context.selectedDate,
                today: context.today,
                direction,
                availability: context.availability,
            }) ?? visibleMonth,
    };
}

function moveCalendarFocus(
    context: CalendarDecisionContext,
    action: Extract<CalendarBehaviorAction, { type: 'move-focus' }>,
): CalendarBehaviorTransition | null {
    const focusedDate = getKeyboardTarget(action, context.firstDayOfWeek, context.availability);
    return focusedDate
        ? {
              visibleMonth: startOfMonth(focusedDate),
              focusedDate,
          }
        : null;
}

function decideCalendarBehavior(
    context: CalendarDecisionContext,
    action: CalendarBehaviorAction,
): CalendarBehaviorTransition | null {
    switch (action.type) {
        case 'resolve-focusable':
            return resolveFocusableDate(context, action);
        case 'align-month':
            return alignCalendarMonth(context, action);
        case 'navigate-month':
            return navigateCalendarMonth(context, action);
        case 'move-focus':
            return moveCalendarFocus(context, action);
    }
}

export function createCalendarBehavior(options: CalendarBehaviorOptions): CalendarBehavior {
    const month = startOfMonth(options.month);
    const selectedDate = normalizeDate(options.selectedDate);
    const today = toLocalDate(options.today);
    const firstDayOfWeek = normalizeFirstDayOfWeek(options.firstDayOfWeek);
    const availability = {
        min: options.min,
        max: options.max,
        disabledDates: options.disabledDates,
    };
    const projectionOptions = {
        ...options,
        month,
        selectedDate,
        today,
    };
    const days = createCalendarDays(projectionOptions, firstDayOfWeek);
    const visibleDays = days.filter(
        (day) => !day.hidden && !day.disabled && isSameMonth(day.date, month),
    );
    const view = {
        days,
        weeks: createCalendarWeeks(days),
        weekdays: getCalendarWeekdays(
            options.locale,
            firstDayOfWeek,
            options.weekdayFormat ?? 'short',
        ),
        monthLabel: new Intl.DateTimeFormat(
            options.locale,
            options.monthFormat ?? { month: 'long', year: 'numeric' },
        ).format(month),
        previousDisabled:
            Boolean(options.disabled) ||
            !findNavigableMonth(addCalendarMonths(month, -1), -1, availability),
        nextDisabled:
            Boolean(options.disabled) ||
            !findNavigableMonth(addCalendarMonths(month, 1), 1, availability),
    };
    const context = {
        month,
        selectedDate,
        today,
        firstDayOfWeek,
        disabled: Boolean(options.disabled),
        availability,
        visibleDays,
    };

    return {
        view,
        decide: (action) => decideCalendarBehavior(context, action),
    };
}
