import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue';
import { useControllableValue } from '@/composables/useControllableValue';
import { bem } from '@/utils/bem';
import {
    isSameDate,
    isSameMonth,
    normalizeDate,
    startOfMonth,
    toDateKey,
    toLocalDate,
} from '@/utils/date';
import { createCalendarBehavior } from './calendarBehavior';
import type { CalendarDay, CalendarProps } from './types';

interface CalendarEmitters {
    value: (value: Date) => void;
    month: (month: Date) => void;
    change: (value: Date) => void;
}

function initialMonth(props: Readonly<CalendarProps>): Date {
    return startOfMonth(
        normalizeDate(props.month) ??
            normalizeDate(props.defaultMonth) ??
            normalizeDate(props.modelValue) ??
            normalizeDate(props.defaultValue) ??
            new Date(),
    );
}

export function useCalendar(props: Readonly<CalendarProps>, emit: CalendarEmitters) {
    const rootRef = ref<HTMLElement | null>(null);
    const today = shallowRef(toLocalDate(new Date()));
    const uncontrolledMonth = shallowRef(initialMonth(props));
    const controllable = useControllableValue<Date | null>({
        modelValue: () => props.modelValue,
        defaultValue: () => normalizeDate(props.defaultValue),
        onChange(value) {
            if (!value) return;
            emit.value(value);
            emit.change(value);
        },
    });
    const selectedDate = computed(() => normalizeDate(controllable.value.value));
    const visibleMonth = computed(() => normalizeDate(props.month) ?? uncontrolledMonth.value);
    const focusedDate = shallowRef(
        selectedDate.value && isSameMonth(selectedDate.value, visibleMonth.value)
            ? selectedDate.value
            : isSameMonth(today.value, visibleMonth.value)
              ? today.value
              : visibleMonth.value,
    );
    const behavior = computed(() =>
        createCalendarBehavior({
            month: visibleMonth.value,
            selectedDate: selectedDate.value,
            today: today.value,
            firstDayOfWeek: props.firstDayOfWeek,
            weekdayFormat: props.weekdayFormat,
            locale: props.locale,
            monthFormat: props.monthFormat,
            fixedWeeks: props.fixedWeeks,
            hideOutsideDates: props.hideOutsideDates,
            disabled: props.disabled,
            min: props.min,
            max: props.max,
            disabledDates: props.disabledDates,
        }),
    );
    const days = computed(() => behavior.value.view.days);
    const weeks = computed(() => behavior.value.view.weeks);
    const weekdays = computed(() => behavior.value.view.weekdays);
    const monthLabel = computed(() => behavior.value.view.monthLabel);
    const previousDisabled = computed(() => behavior.value.view.previousDisabled);
    const nextDisabled = computed(() => behavior.value.view.nextDisabled);
    const focusableDate = computed(
        () =>
            behavior.value.decide({
                type: 'resolve-focusable',
                focusedDate: focusedDate.value,
            })?.focusedDate ?? null,
    );
    const rootClass = computed(() =>
        bem('rp-calendar', {
            [`size-${props.size}`]: Boolean(props.size),
            [`radius-${props.radius}`]: Boolean(props.radius),
            disabled: props.disabled,
            readonly: props.readonly,
        }),
    );
    let todayTimer: ReturnType<typeof setTimeout> | undefined;
    let ownerDocument: Document | null = null;
    let ownerWindow: Window | null = null;

    watch(
        () => props.modelValue,
        (value) => {
            const normalized = normalizeDate(value);
            if (!normalized) return;
            focusedDate.value = normalized;
            if (props.month === undefined) uncontrolledMonth.value = startOfMonth(normalized);
        },
        { flush: 'sync' },
    );

    watch(
        visibleMonth,
        (_month, previousMonth) => {
            const transition = behavior.value.decide({
                type: 'align-month',
                previousMonth,
                focusedDate: focusedDate.value,
            });
            if (transition) focusedDate.value = transition.focusedDate;
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
        const calendarHadFocus =
            rootRef.value?.contains(rootRef.value.ownerDocument.activeElement) ?? false;
        controllable.setValue(date);
        focusedDate.value = date;
        if (isSameMonth(date, visibleMonth.value)) return;
        if (
            !calendarHadFocus ||
            !rootRef.value?.contains(rootRef.value.ownerDocument.activeElement)
        ) {
            return;
        }
        void focusDate(date);
    }

    function navigateMonth(amount: number) {
        const transition = behavior.value.decide({
            type: 'navigate-month',
            amount,
            focusedDate: focusedDate.value,
        });
        if (!transition?.visibleMonth) return;
        focusedDate.value = transition.focusedDate;
        setVisibleMonth(transition.visibleMonth);
    }

    async function focusDate(date: Date) {
        const normalized = toLocalDate(date);
        focusedDate.value = normalized;
        setVisibleMonth(normalized);
        await nextTick();
        rootRef.value
            ?.querySelector<HTMLButtonElement>(`[data-date="${toDateKey(normalized)}"]`)
            ?.focus();
    }

    function onDayKeydown(event: KeyboardEvent, day: CalendarDay) {
        if ((event.key === 'Enter' || event.key === ' ') && !day.disabled) {
            event.preventDefault();
            selectDate(day);
            return;
        }

        const transition = behavior.value.decide({
            type: 'move-focus',
            date: day.date,
            key: event.key,
            shiftKey: event.shiftKey,
        });
        if (!transition) return;
        event.preventDefault();
        void focusDate(transition.focusedDate);
    }

    function onDayFocus(day: CalendarDay) {
        focusedDate.value = day.date;
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
    };
}
