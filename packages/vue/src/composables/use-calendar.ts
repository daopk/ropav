import type {CalendarSelectionMode, CalendarState} from "./use-calendar-state";
import type {CalendarDate, DateFormatter} from "@internationalized/date";
import type {LocalizedStringFormatter} from "@internationalized/string";
import type {ComputedRef, MaybeRefOrGetter} from "vue";

import {endOfMonth, isSameDay, startOfMonth} from "@internationalized/date";
import {computed, shallowRef, toValue, watch, watchEffect} from "vue";

import {calendarStrings} from "../i18n/calendar";
import {announce} from "../utils/live-announcer";

import {useDateFormatter} from "./use-date-formatter";
import {useId} from "./use-id";
import {useLabels} from "./use-labels";
import {useLocale} from "./use-locale";
import {useLocalizedStringFormatter} from "./use-localized-string-formatter";

/**
 * The extra state a range calendar carries.
 *
 * Declared here rather than in the state file because the behaviour hooks are what branch on it:
 * they take either kind of calendar and tell the two apart by whether `highlightedRange` is
 * present, exactly as react-aria does.
 */
export interface RangeCalendarStateExtras {
  /** The range under the cursor, which is the pending one while a drag is in progress. */
  highlightedRange: ComputedRef<CalendarRange | null>;
  /** The end the user pinned first, or `null` when no range is being built. */
  anchorDate: ComputedRef<CalendarDate | null>;
  /** Whether a pointer is dragging a range out. */
  isDragging: ComputedRef<boolean>;
  setAnchorDate: (date: CalendarDate | null) => void;
  setDragging: (isDragging: boolean) => void;
  highlightDate: (date: CalendarDate) => void;
  focusNearestAvailableDate: (date: CalendarDate) => void;
}

/** Two dates and everything between them. */
export interface CalendarRange {
  start: CalendarDate;
  end: CalendarDate;
}

/** Whatever this calendar has selected: one date, a set of them, or a range. */
export type CalendarSelectedValue = CalendarDate | CalendarDate[] | CalendarRange | null;

/**
 * Either kind of calendar state, since every behaviour hook below takes both.
 *
 * `value` is widened rather than left as the single calendar's, and `selectionMode` becomes optional
 * — a range calendar has no mode of its own. Everything else the hooks read is common to both, so
 * they need no narrowing except where they genuinely branch.
 */
export type AnyCalendarState = Omit<CalendarState, "selectionMode" | "setValue" | "value"> & {
  value: ComputedRef<CalendarSelectedValue>;
  selectionMode?: ComputedRef<CalendarSelectionMode>;
} & Partial<RangeCalendarStateExtras>;

/** A range calendar's state: the shared surface, plus the extras, with `value` narrowed to a range. */
export type RangeCalendarLikeState = Omit<AnyCalendarState, "value"> &
  RangeCalendarStateExtras & {value: ComputedRef<CalendarRange | null>};

/** Whether a range calendar's own state is in play, which is how react-aria branches. */
export const isRangeCalendarState = (state: AnyCalendarState): state is RangeCalendarLikeState =>
  "highlightedRange" in state;

/**
 * Whether a date needs its era spelled out.
 *
 * Only for Gregorian dates before AD 1: "15 June 44" would otherwise read as a year the user
 * recognises when it is not.
 */
export const getEraFormat = (date: CalendarDate | undefined): "short" | undefined =>
  date?.calendar.identifier === "gregory" && date.era === "BC" ? "short" : undefined;

/**
 * Split a formatted date range back into its two halves and rejoin them with a localised word.
 *
 * `formatRange` produces something like "June 1 – 30, 2026", which reads badly to a screen reader
 * one character at a time. The separator is found as the last literal shared by both ends, and the
 * halves are rejoined through the "{startDate} to {endDate}" message instead.
 */
const formatRangeForAria = (
  dateFormatter: DateFormatter,
  stringFormatter: LocalizedStringFormatter<string, string>,
  start: CalendarDate,
  end: CalendarDate,
  timeZone: string,
) => {
  const parts = dateFormatter.formatRangeToParts(start.toDate(timeZone), end.toDate(timeZone));
  let separatorIndex = -1;

  for (let index = 0; index < parts.length; index++) {
    const part = parts[index]!;

    if (part.source === "shared" && part.type === "literal") separatorIndex = index;
    else if (part.source === "endRange") break;
  }

  let startValue = "";
  let endValue = "";

  for (let index = 0; index < parts.length; index++) {
    if (index < separatorIndex) startValue += parts[index]!.value;
    else if (index > separatorIndex) endValue += parts[index]!.value;
  }

  return stringFormatter.format("dateRange", {endDate: endValue, startDate: startValue});
};

/**
 * A spoken description of what is selected, for announcing a change no visible text reports.
 *
 * Ported from react-aria's `packages/react-aria/src/calendar/utils.ts` (react-aria 3.51.0).
 */
export const useSelectedDateDescription = (state: AnyCalendarState): ComputedRef<string> => {
  const stringFormatter = useLocalizedStringFormatter(calendarStrings);
  const locale = useLocale();

  const ends = computed<{start?: CalendarDate; end?: CalendarDate}>(() => {
    if (isRangeCalendarState(state)) return state.highlightedRange.value ?? {};

    const value = state.value.value;

    if (Array.isArray(value)) return {end: value.at(-1), start: value[0]};

    const date = value && "start" in value ? null : value;

    return {end: date ?? undefined, start: date ?? undefined};
  });

  const dateFormatter = useDateFormatter(() => ({
    day: "numeric",
    era: getEraFormat(ends.value.start) || getEraFormat(ends.value.end),
    month: "long",
    timeZone: state.timeZone.value,
    weekday: "long",
    year: "numeric",
  }));

  return computed(() => {
    const {end, start} = ends.value;
    const anchorDate = state.anchorDate?.value ?? null;

    // Nothing to say while a range is still being pinned down, or when nothing is highlighted.
    if (anchorDate || !start || !end) return "";

    const timeZone = state.timeZone.value;

    if (isSameDay(start, end)) {
      return stringFormatter.value.format("selectedDateDescription", {
        date: dateFormatter.value.format(start.toDate(timeZone)),
      });
    }

    if (isRangeCalendarState(state)) {
      return stringFormatter.value.format("selectedRangeDescription", {
        dateRange: formatRangeForAria(
          dateFormatter.value,
          stringFormatter.value,
          start,
          end,
          timeZone,
        ),
      });
    }

    const value = state.value.value;

    if (Array.isArray(value)) {
      return stringFormatter.value.format("selectedDateDescription", {
        date: new Intl.ListFormat(locale.value.locale).format(
          value.map((date) => dateFormatter.value.format(date.toDate(timeZone))),
        ),
      });
    }

    return "";
  });
};

/**
 * A description of the dates on screen, used as the calendar's title and as part of its name.
 *
 * Ported from react-aria's `packages/react-aria/src/calendar/utils.ts` (react-aria 3.51.0).
 *
 * `isAria` picks between the two readings of the same range: the visible title uses the browser's
 * own range formatting, while the accessible name spells the separator out as a word.
 */
export const useVisibleRangeDescription = (
  startDate: MaybeRefOrGetter<CalendarDate>,
  endDate: MaybeRefOrGetter<CalendarDate>,
  timeZone: MaybeRefOrGetter<string>,
  isAria: boolean,
): ComputedRef<string> => {
  const stringFormatter = useLocalizedStringFormatter(calendarStrings);
  const era = computed(() => getEraFormat(toValue(startDate)) || getEraFormat(toValue(endDate)));

  const monthFormatter = useDateFormatter(() => ({
    calendar: toValue(startDate).calendar.identifier,
    era: era.value,
    month: "long",
    timeZone: toValue(timeZone),
    year: "numeric",
  }));

  const dateFormatter = useDateFormatter(() => ({
    calendar: toValue(startDate).calendar.identifier,
    day: "numeric",
    era: era.value,
    month: "long",
    timeZone: toValue(timeZone),
    year: "numeric",
  }));

  return computed(() => {
    const start = toValue(startDate);
    const end = toValue(endDate);
    const zone = toValue(timeZone);

    // A range that covers whole months reads as months rather than as two dates.
    if (isSameDay(start, startOfMonth(start))) {
      const startMonth = start.calendar.getFormattableMonth?.(start) ?? start;
      const endMonth = end.calendar.getFormattableMonth?.(end) ?? end;

      if (isSameDay(end, endOfMonth(start))) {
        return monthFormatter.value.format(startMonth.toDate(zone));
      }

      if (isSameDay(end, endOfMonth(end))) {
        return isAria
          ? formatRangeForAria(
              monthFormatter.value,
              stringFormatter.value,
              startMonth,
              endMonth,
              zone,
            )
          : monthFormatter.value.formatRange(startMonth.toDate(zone), endMonth.toDate(zone));
      }
    }

    return isAria
      ? formatRangeForAria(dateFormatter.value, stringFormatter.value, start, end, zone)
      : dateFormatter.value.formatRange(start.toDate(zone), end.toDate(zone));
  });
};

/**
 * An id that resolves to `undefined` unless something in the document actually uses it.
 *
 * Ported from react-aria's `useSlotId`. The calendar hands its cells an `aria-describedby`
 * pointing at an error message that the caller may never render — a dangling reference reads as a
 * broken control to a screen reader, so the id disappears when no element claims it.
 */
const useSlotId = (deps: MaybeRefOrGetter<unknown>): ComputedRef<string | undefined> => {
  const id = useId();

  /*
   * Starts out claimed, which is what lets the element claim it at all: the error message takes its
   * own id from here, so withholding it up front would guarantee nothing ever has it. React does
   * the same thing by yielding the id first and the resolved answer second.
   */
  const isUsed = shallowRef(true);

  // Post-flush and with no immediate run, so the check happens once the DOM exists — the element
  // that claims the id is rendered by the very component asking for it.
  watchEffect(
    () => {
      void toValue(deps);
      isUsed.value = Boolean(document.getElementById(id.value));
    },
    {flush: "post"},
  );

  return computed(() => (isUsed.value ? id.value : undefined));
};

export interface UseCalendarOptions {
  id?: MaybeRefOrGetter<string | undefined>;
  ariaLabel?: MaybeRefOrGetter<string | undefined>;
  ariaLabelledby?: MaybeRefOrGetter<string | undefined>;
  ariaDescribedby?: MaybeRefOrGetter<string | undefined>;
  ariaDetails?: MaybeRefOrGetter<string | undefined>;
  /** Whether an error message is being rendered, which is what gives its id something to point at. */
  hasErrorMessage?: MaybeRefOrGetter<boolean | undefined>;
  isDisabled?: MaybeRefOrGetter<boolean | undefined>;
  isInvalid?: MaybeRefOrGetter<boolean | undefined>;
}

/** A previous/next button, which the calendar owns because only it knows where the bounds are. */
export interface CalendarNavButton {
  /** Spread with `v-bind`. Never carries an `on*` key. */
  attrs: ComputedRef<Record<string, unknown>>;
  isDisabled: ComputedRef<boolean>;
  onPress: () => void;
  onFocusChange: (isFocused: boolean) => void;
}

/**
 * What the grids and cells need from the calendar above them.
 *
 * react-aria smuggles this through a module-level `WeakMap` keyed by the state object, because a
 * nested grid has no other way to reach the calendar's own labelling. Published through
 * provide/inject instead, so a grid rendered inside a date picker — with no calendar root of its
 * own in the tree — still finds it.
 */
export interface CalendarShared {
  ariaLabel: ComputedRef<string | undefined>;
  ariaLabelledBy: ComputedRef<string | undefined>;
  errorMessageId: ComputedRef<string | undefined>;
  selectedDateDescription: ComputedRef<string>;
}

export interface UseCalendarReturn {
  /** Spread with `v-bind` onto the calendar's own element. */
  attrs: ComputedRef<Record<string, unknown>>;
  prevButton: CalendarNavButton;
  nextButton: CalendarNavButton;
  errorMessageProps: ComputedRef<{id: string | undefined}>;
  /** A description of the visible range, for the calendar's heading. */
  title: ComputedRef<string>;
  shared: CalendarShared;
}

/**
 * The behaviour and accessibility wiring for a calendar.
 *
 * Ported from react-aria's `packages/react-aria/src/calendar/useCalendarBase.ts` and
 * `useCalendar.ts` (react-aria 3.51.0).
 *
 * `role="application"` rather than a grid role on the wrapper is deliberate upstream: it stops a
 * screen reader's own table navigation from taking the arrow keys the calendar needs.
 */
export const useCalendar = (
  options: UseCalendarOptions,
  state: AnyCalendarState,
): UseCalendarReturn => {
  const stringFormatter = useLocalizedStringFormatter(calendarStrings);

  const title = useVisibleRangeDescription(
    () => state.visibleRange.value.start,
    () => state.visibleRange.value.end,
    () => state.timeZone.value,
    false,
  );
  const visibleRangeDescription = useVisibleRangeDescription(
    () => state.visibleRange.value.start,
    () => state.visibleRange.value.end,
    () => state.timeZone.value,
    true,
  );

  // Only when the range moved without focus being inside — otherwise the focused cell's own
  // announcement already says where the user is, and both would be read.
  watch(visibleRangeDescription, (description) => {
    if (!state.isFocused.value) announce(description);
  });

  const selectedDateDescription = useSelectedDateDescription(state);

  watch(selectedDateDescription, (description) => {
    if (description) announce(description, "polite");
  });

  const errorMessageId = useSlotId(() => [
    Boolean(toValue(options.hasErrorMessage)),
    toValue(options.isInvalid),
  ]);

  /*
   * A nav button that goes disabled while it holds focus would drop focus to the document, so the
   * calendar takes it instead. React tracks this with two pieces of state checked during render;
   * here each button reports its own focus and the check runs on the way in.
   */
  const isNextFocused = shallowRef(false);
  const isPreviousFocused = shallowRef(false);

  const isNextDisabled = computed(
    () => Boolean(toValue(options.isDisabled)) || state.isNextVisibleRangeInvalid(),
  );
  const isPreviousDisabled = computed(
    () => Boolean(toValue(options.isDisabled)) || state.isPreviousVisibleRangeInvalid(),
  );

  watch([isNextDisabled, isNextFocused], ([isDisabled, isFocused]) => {
    if (isDisabled && isFocused) {
      isNextFocused.value = false;
      state.setFocused(true);
    }
  });

  watch([isPreviousDisabled, isPreviousFocused], ([isDisabled, isFocused]) => {
    if (isDisabled && isFocused) {
      isPreviousFocused.value = false;
      state.setFocused(true);
    }
  });

  const labels = useLabels(() => ({
    "aria-label": [toValue(options.ariaLabel), visibleRangeDescription.value]
      .filter(Boolean)
      .join(", "),
    "aria-labelledby": toValue(options.ariaLabelledby),
    id: toValue(options.id),
  }));

  return {
    attrs: computed(() => ({
      ...labels.value,
      "aria-describedby": toValue(options.ariaDescribedby) || undefined,
      "aria-details": toValue(options.ariaDetails) || undefined,
      role: "application",
    })),
    errorMessageProps: computed(() => ({id: errorMessageId.value})),
    nextButton: {
      attrs: computed(() => ({"aria-label": stringFormatter.value.format("next")})),
      isDisabled: isNextDisabled,
      onFocusChange: (isFocused) => {
        isNextFocused.value = isFocused;
      },
      onPress: () => state.focusNextPage(),
    },
    prevButton: {
      attrs: computed(() => ({"aria-label": stringFormatter.value.format("previous")})),
      isDisabled: isPreviousDisabled,
      onFocusChange: (isFocused) => {
        isPreviousFocused.value = isFocused;
      },
      onPress: () => state.focusPreviousPage(),
    },
    shared: {
      ariaLabel: computed(() => toValue(options.ariaLabel)),
      ariaLabelledBy: computed(() => toValue(options.ariaLabelledby)),
      errorMessageId,
      selectedDateDescription,
    },
    title,
  };
};
