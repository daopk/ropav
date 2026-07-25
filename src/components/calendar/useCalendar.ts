import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue';
import { useControllableValue } from '@/composables/useControllableValue';
import { bem } from '@/utils/bem';
import {
    addCalendarDays,
    addCalendarMonths,
    addCalendarYears,
    compareDates,
    endOfMonth,
    isSameDate,
    isSameMonth,
    startOfMonth,
    toDateKey,
    toLocalDate,
} from '@/utils/date';
import {
    createCalendarDays,
    createCalendarWeeks,
    getCalendarDayLabel,
    getCalendarMonthLabel,
    getCalendarWeekdays,
    isCalendarDateDisabled,
    normalizeCalendarDate,
    normalizeFirstDayOfWeek,
} from './calendarModel';
import type { CalendarDay, CalendarProps } from './types';

interface CalendarEmitters {
    value: (value: Date) => void;
    month: (month: Date) => void;
    change: (value: Date) => void;
}

type CalendarDateOptions = Pick<CalendarProps, 'min' | 'max' | 'disabledDates'>;
type SearchDirection = 1 | -1;

interface EnabledDateSearch {
    candidate: Date;
    direction: SearchDirection;
    min?: Date;
    max?: Date;
    calendarOptions: CalendarDateOptions;
}

interface PreferredDateOptions {
    month: Date;
    anchor: Date;
    selectedDate: Date | null;
    today: Date;
    direction: SearchDirection;
    calendarOptions: CalendarDateOptions;
}

function initialMonth(props: Readonly<CalendarProps>): Date {
    return startOfMonth(
        normalizeCalendarDate(props.month) ??
            normalizeCalendarDate(props.defaultMonth) ??
            normalizeCalendarDate(props.modelValue) ??
            normalizeCalendarDate(props.defaultValue) ??
            new Date(),
    );
}

function monthHasSelectableDate(month: Date, options: CalendarDateOptions) {
    const first = startOfMonth(month);
    const last = endOfMonth(month);
    for (let date = first; date <= last; date = addCalendarDays(date, 1)) {
        if (!isCalendarDateDisabled(date, options)) return true;
    }
    return false;
}

function monthIntersectsBounds(month: Date, options: CalendarDateOptions) {
    const min = normalizeCalendarDate(options.min);
    const max = normalizeCalendarDate(options.max);
    return (
        (!min || compareDates(endOfMonth(month), min) >= 0) &&
        (!max || compareDates(startOfMonth(month), max) <= 0)
    );
}

function findNavigableMonth(
    requestedMonth: Date,
    direction: SearchDirection,
    options: CalendarDateOptions,
): Date | null {
    const min = normalizeCalendarDate(options.min);
    const max = normalizeCalendarDate(options.max);
    const hasDirectionalBound = direction === 1 ? Boolean(max) : Boolean(min);
    let candidate = startOfMonth(requestedMonth);

    if (direction === 1 && min && compareDates(endOfMonth(candidate), min) < 0) {
        candidate = startOfMonth(min);
    } else if (direction === -1 && max && compareDates(startOfMonth(candidate), max) > 0) {
        candidate = startOfMonth(max);
    }

    while (monthIntersectsBounds(candidate, options)) {
        if (monthHasSelectableDate(candidate, options)) return candidate;

        const followingMonth = addCalendarMonths(candidate, direction);
        if (!monthIntersectsBounds(followingMonth, options)) return null;

        // A predicate can describe an unbounded run of unavailable months. Keep traversal
        // possible instead of trying to prove that no future selectable date exists.
        if (typeof options.disabledDates === 'function' && !hasDirectionalBound) return candidate;
        candidate = followingMonth;
    }

    return null;
}

function findEnabledDate(search: EnabledDateSearch): Date | null {
    let current = search.candidate;
    for (let index = 0; index < 3660; index += 1) {
        if (search.min && compareDates(current, search.min) < 0) return null;
        if (search.max && compareDates(current, search.max) > 0) return null;
        if (!isCalendarDateDisabled(current, search.calendarOptions)) return current;
        current = addCalendarDays(current, search.direction);
    }
    return null;
}

function findEnabledDateInMonth(
    candidate: Date,
    direction: SearchDirection,
    options: CalendarDateOptions,
) {
    const min = startOfMonth(candidate);
    const max = endOfMonth(candidate);
    return (
        findEnabledDate({ candidate, direction, min, max, calendarOptions: options }) ??
        findEnabledDate({
            candidate: addCalendarDays(candidate, -direction),
            direction: -direction as SearchDirection,
            min,
            max,
            calendarOptions: options,
        })
    );
}

function getPreferredDateForMonth(options: PreferredDateOptions): Date | null {
    const month = startOfMonth(options.month);
    const selected = options.selectedDate;
    if (
        selected &&
        isSameMonth(selected, month) &&
        !isCalendarDateDisabled(selected, options.calendarOptions)
    ) {
        return selected;
    }
    if (
        isSameMonth(options.today, month) &&
        !isCalendarDateDisabled(options.today, options.calendarOptions)
    ) {
        return options.today;
    }

    const anchor = new Date(
        month.getFullYear(),
        month.getMonth(),
        Math.min(options.anchor.getDate(), endOfMonth(month).getDate()),
    );
    return findEnabledDateInMonth(anchor, options.direction, options.calendarOptions);
}

function getKeyboardTarget(
    event: KeyboardEvent,
    date: Date,
    firstDayOfWeek: number,
    calendarOptions: CalendarDateOptions,
): Date | null {
    switch (event.key) {
        case 'ArrowLeft':
            return findEnabledDate({
                candidate: addCalendarDays(date, -1),
                direction: -1,
                calendarOptions,
            });
        case 'ArrowRight':
            return findEnabledDate({
                candidate: addCalendarDays(date, 1),
                direction: 1,
                calendarOptions,
            });
        case 'ArrowUp':
            return findEnabledDate({
                candidate: addCalendarDays(date, -7),
                direction: -1,
                calendarOptions,
            });
        case 'ArrowDown':
            return findEnabledDate({
                candidate: addCalendarDays(date, 7),
                direction: 1,
                calendarOptions,
            });
        case 'Home': {
            const offset = (date.getDay() - firstDayOfWeek + 7) % 7;
            const min = addCalendarDays(date, -offset);
            return findEnabledDate({
                candidate: min,
                direction: 1,
                min,
                max: addCalendarDays(min, 6),
                calendarOptions,
            });
        }
        case 'End': {
            const offset = (firstDayOfWeek + 6 - date.getDay() + 7) % 7;
            const max = addCalendarDays(date, offset);
            return findEnabledDate({
                candidate: max,
                direction: -1,
                min: addCalendarDays(max, -6),
                max,
                calendarOptions,
            });
        }
        case 'PageUp':
            return findEnabledDateInMonth(
                event.shiftKey ? addCalendarYears(date, -1) : addCalendarMonths(date, -1),
                -1,
                calendarOptions,
            );
        case 'PageDown':
            return findEnabledDateInMonth(
                event.shiftKey ? addCalendarYears(date, 1) : addCalendarMonths(date, 1),
                1,
                calendarOptions,
            );
        default:
            return null;
    }
}

export function useCalendar(props: Readonly<CalendarProps>, emit: CalendarEmitters) {
    const rootRef = ref<HTMLElement | null>(null);
    const today = shallowRef(toLocalDate(new Date()));
    const uncontrolledMonth = shallowRef(initialMonth(props));
    const controllable = useControllableValue<Date | null>({
        modelValue: () => props.modelValue,
        defaultValue: () => normalizeCalendarDate(props.defaultValue),
        onChange(value) {
            if (!value) return;
            emit.value(value);
            emit.change(value);
        },
    });
    const selectedDate = computed(() => normalizeCalendarDate(controllable.value.value));
    const visibleMonth = computed(
        () => normalizeCalendarDate(props.month) ?? uncontrolledMonth.value,
    );
    const firstDayOfWeek = computed(() => normalizeFirstDayOfWeek(props.firstDayOfWeek));
    const focusedDate = shallowRef(
        selectedDate.value && isSameMonth(selectedDate.value, visibleMonth.value)
            ? selectedDate.value
            : isSameMonth(today.value, visibleMonth.value)
              ? today.value
              : visibleMonth.value,
    );
    const calendarOptions = computed(() => ({
        min: props.min,
        max: props.max,
        disabledDates: props.disabledDates,
    }));
    const days = computed(() =>
        createCalendarDays({
            month: visibleMonth.value,
            selectedDate: selectedDate.value,
            today: today.value,
            firstDayOfWeek: firstDayOfWeek.value,
            fixedWeeks: props.fixedWeeks ?? true,
            hideOutsideDates: props.hideOutsideDates ?? false,
            ...calendarOptions.value,
        }),
    );
    const weeks = computed(() => createCalendarWeeks(days.value));
    const weekdays = computed(() =>
        getCalendarWeekdays(props.locale, firstDayOfWeek.value, props.weekdayFormat ?? 'short'),
    );
    const monthLabel = computed(() =>
        getCalendarMonthLabel(visibleMonth.value, props.locale, props.monthFormat),
    );
    const rootClass = computed(() =>
        bem('rp-calendar', {
            [`size-${props.size}`]: Boolean(props.size),
            [`radius-${props.radius}`]: Boolean(props.radius),
            disabled: props.disabled,
            readonly: props.readonly,
        }),
    );
    const previousDisabled = computed(
        () =>
            Boolean(props.disabled) ||
            !findNavigableMonth(
                addCalendarMonths(visibleMonth.value, -1),
                -1,
                calendarOptions.value,
            ),
    );
    const nextDisabled = computed(
        () =>
            Boolean(props.disabled) ||
            !findNavigableMonth(addCalendarMonths(visibleMonth.value, 1), 1, calendarOptions.value),
    );
    const focusableDate = computed(() => {
        const visibleDays = days.value.filter(
            (day) => !day.hidden && !day.disabled && isSameMonth(day.date, visibleMonth.value),
        );
        const focused = visibleDays.find((day) => isSameDate(day.date, focusedDate.value));
        if (focused) return focused.date;

        const selected = visibleDays.find((day) => day.selected);
        const current = visibleDays.find((day) => day.today);
        return selected?.date ?? current?.date ?? visibleDays[0]?.date ?? null;
    });
    let todayTimer: ReturnType<typeof setTimeout> | undefined;
    let ownerDocument: Document | null = null;
    let ownerWindow: Window | null = null;

    watch(
        () => props.modelValue,
        (value) => {
            const normalized = normalizeCalendarDate(value);
            if (!normalized) return;
            focusedDate.value = normalized;
            if (props.month === undefined) uncontrolledMonth.value = startOfMonth(normalized);
        },
        { flush: 'sync' },
    );

    watch(
        visibleMonth,
        (month, previousMonth) => {
            if (isSameMonth(focusedDate.value, month)) return;
            const direction = compareDates(month, previousMonth) >= 0 ? 1 : -1;
            focusedDate.value =
                getPreferredDateForMonth({
                    month,
                    anchor: focusedDate.value,
                    selectedDate: selectedDate.value,
                    today: today.value,
                    direction,
                    calendarOptions: calendarOptions.value,
                }) ?? startOfMonth(month);
        },
        { flush: 'sync' },
    );

    function setVisibleMonth(month: Date) {
        const normalized = startOfMonth(month);
        if (isSameMonth(normalized, visibleMonth.value)) return;
        if (props.month === undefined) uncontrolledMonth.value = normalized;
        emit.month(normalized);
    }

    function selectDate(day: CalendarDay) {
        if (props.disabled || props.readonly || day.disabled || day.hidden) return;
        const date = toLocalDate(day.date);
        controllable.setValue(date);
        focusedDate.value = date;
        if (isSameMonth(date, visibleMonth.value)) return;
        void focusDate(date);
    }

    function navigateMonth(amount: number) {
        if (props.disabled || amount === 0) return;
        const direction = amount > 0 ? 1 : -1;
        const next = findNavigableMonth(
            addCalendarMonths(visibleMonth.value, amount),
            direction,
            calendarOptions.value,
        );
        if (!next) return;
        focusedDate.value =
            getPreferredDateForMonth({
                month: next,
                anchor: focusedDate.value,
                selectedDate: selectedDate.value,
                today: today.value,
                direction,
                calendarOptions: calendarOptions.value,
            }) ?? startOfMonth(next);
        setVisibleMonth(next);
    }

    async function focusDate(date: Date) {
        focusedDate.value = date;
        setVisibleMonth(date);
        await nextTick();
        rootRef.value
            ?.querySelector<HTMLButtonElement>(`[data-date="${toDateKey(date)}"]`)
            ?.focus();
    }

    function onDayKeydown(event: KeyboardEvent, day: CalendarDay) {
        if ((event.key === 'Enter' || event.key === ' ') && !day.disabled) {
            event.preventDefault();
            selectDate(day);
            return;
        }

        const target = getKeyboardTarget(
            event,
            day.date,
            firstDayOfWeek.value,
            calendarOptions.value,
        );
        if (!target) return;
        event.preventDefault();
        void focusDate(target);
    }

    function onDayFocus(day: CalendarDay) {
        focusedDate.value = day.date;
    }

    function getDayAriaLabel(day: CalendarDay) {
        return getCalendarDayLabel(day.date, props.locale);
    }

    function scheduleTodayRefresh() {
        if (todayTimer !== undefined) clearTimeout(todayTimer);
        const now = new Date();
        const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        todayTimer = setTimeout(refreshToday, tomorrow.getTime() - now.getTime());
    }

    function refreshToday() {
        const current = toLocalDate(new Date());
        const previous = today.value;
        today.value = current;
        if (
            !selectedDate.value &&
            isSameDate(focusedDate.value, previous) &&
            isSameMonth(current, visibleMonth.value)
        ) {
            focusedDate.value = current;
        }
        scheduleTodayRefresh();
    }

    function refreshTodayWhenVisible() {
        if (ownerDocument?.visibilityState !== 'hidden') refreshToday();
    }

    onMounted(() => {
        ownerDocument = rootRef.value?.ownerDocument ?? document;
        ownerWindow = ownerDocument.defaultView;
        ownerDocument.addEventListener('visibilitychange', refreshTodayWhenVisible);
        ownerWindow?.addEventListener('focus', refreshToday);
        scheduleTodayRefresh();
    });

    onBeforeUnmount(() => {
        if (todayTimer !== undefined) clearTimeout(todayTimer);
        ownerDocument?.removeEventListener('visibilitychange', refreshTodayWhenVisible);
        ownerWindow?.removeEventListener('focus', refreshToday);
    });

    return {
        rootRef,
        selectedDate,
        visibleMonth,
        days,
        weeks,
        weekdays,
        monthLabel,
        rootClass,
        previousDisabled,
        nextDisabled,
        focusableDate,
        selectDate,
        navigateMonth,
        onDayKeydown,
        onDayFocus,
        getDayAriaLabel,
    };
}
