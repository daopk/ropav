import type { calendarYearPickerVariants } from "@ropav/styles";
import type { ComputedRef, ShallowRef } from "vue";

import { createContext } from "../../utils/create-context";

export interface YearPickerContext {
  isYearPickerOpen: ComputedRef<boolean>;
  setIsYearPickerOpen: (isOpen: boolean) => void;
  /** The calendar's own element, which the year grid measures itself against. */
  calendarElement: ShallowRef<HTMLElement | null>;
  /** Which grid the year grid overlays — the two calendars name theirs differently. */
  calendarGridSlot: "calendar-grid" | "range-calendar-grid";
}

/**
 * Whether the year picker is open, published by the calendar root.
 *
 * Kept apart from the calendar's own state because it is not react-aria's: the trigger and the year
 * grid are siblings in the tree, so neither can own the flag.
 */
export const [useYearPickerContext, provideYearPickerContext] = createContext<YearPickerContext>({
  errorMessage:
    "CalendarYearPicker parts must be used inside a <Calendar> or <RangeCalendar> component.",
  name: "YearPickerContext",
});

export interface YearPickerTriggerContext {
  isOpen: ComputedRef<boolean>;
  /** The month and year the trigger shows, which is also part of its name. */
  monthYear: ComputedRef<string>;
  toggle: () => void;
  slots: ComputedRef<ReturnType<typeof calendarYearPickerVariants>>;
}

/** The trigger's own state, for the heading and indicator inside it. */
export const [useYearPickerTriggerContext, provideYearPickerTriggerContext] =
  createContext<YearPickerTriggerContext>({
    errorMessage:
      "CalendarYearPicker trigger parts must be used inside <CalendarYearPickerTrigger>.",
    name: "YearPickerTriggerContext",
  });

/** One year on offer, and the place in the list that names it. */
export interface YearPickerGridYear {
  /**
   * Where the year sits in the list.
   *
   * What identifies it, rather than the number: a Japanese or Minguo span can cross an era, and an
   * era counts its years from one again, so 8 alone can be four of the years on offer.
   */
  id: number;
  year: number;
  formatted: string;
}

export interface YearPickerGridContext {
  slots: ComputedRef<ReturnType<typeof calendarYearPickerVariants>>;
  isYearPickerOpen: ComputedRef<boolean>;
  /** The year the grid's own keyboard navigation is sitting on, by its place in `years`. */
  activeId: ComputedRef<number>;
  /** The year the calendar is focused on, which is the selected one, by the same. */
  focusedId: ComputedRef<number>;
  years: ComputedRef<YearPickerGridYear[]>;
  selectYear: (id: number) => void;
  setActiveId: (id: number) => void;
}

/** The list of years, for the body and cells inside it. */
export const [useYearPickerGridContext, provideYearPickerGridContext] =
  createContext<YearPickerGridContext>({
    errorMessage: "CalendarYearPicker parts must be used inside <CalendarYearPickerGrid>.",
    name: "YearPickerGridContext",
  });
