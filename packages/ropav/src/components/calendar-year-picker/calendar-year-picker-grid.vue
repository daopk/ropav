<script setup lang="ts" vapor>
import type { CalendarYearPickerGridProps } from "./calendar-year-picker.types";

import { calendarYearPickerVariants } from "@ropav/styles";
import { computed, onScopeDispose, shallowRef, watch, watchEffect } from "vue";

import { useCalendarYearPicker } from "../../composables/use-calendar-year-picker";
import { dataAttr } from "../../utils/assertion";
import { getYearRange } from "../../utils/calendar";
import { useCalendarStateContext } from "../calendar/calendar.context";

import { provideYearPickerGridContext, useYearPickerContext } from "./calendar-year-picker.context";

/** How many years a row holds, which is what the up and down arrows step by. */
const COLUMNS = 3;

const props = defineProps<CalendarYearPickerGridProps>();

defineSlots<{ default?: () => unknown }>();

const { calendarElement, calendarGridSlot, isYearPickerOpen, setIsYearPickerOpen } =
  useYearPickerContext();
const { state } = useCalendarStateContext();

const element = shallowRef<HTMLElement | null>(null);
const slots = computed(() => calendarYearPickerVariants());
const styles = computed(() => slots.value.yearGrid({ class: props.class }));

/**
 * How many years to offer.
 *
 * The whole span between the calendar's bounds by default, because the calendar always has bounds —
 * it synthesises 1900–2099 when none were given — and a picker that stopped short of them would
 * leave years unreachable.
 */
const visibleYears = computed(() => {
  if (props.visibleYears != null) return props.visibleYears;
  if (!state.minValue.value || !state.maxValue.value) return 20;

  return getYearRange(state.minValue.value, state.maxValue.value).length;
});

const picker = useCalendarYearPicker({ format: () => props.format, visibleYears }, state);

const years = computed(() => picker.items.value.map((item) => item.date.year));

const focusedYear = computed(
  () => picker.items.value[picker.value.value]?.date.year ?? state.focusedDate.value.year,
);

const getFormattedYear = (year: number) =>
  picker.items.value.find((item) => item.date.year === year)?.formatted ?? String(year);

const activeYear = shallowRef(focusedYear.value);

/*
 * Lay the year grid over the day grid.
 *
 * The two are siblings, so the overlay has to be measured rather than positioned by the stylesheet.
 * Post-flush, because the day grid has to have been laid out before it can be measured.
 */
watchEffect(
  () => {
    const grid = element.value;
    const calendar = calendarElement.value;

    if (!grid || !calendar) return;

    // Read so the position is recomputed when the calendar pages to a month of a different height.
    void state.focusedDate.value;

    const dayGrid = calendar.querySelector<HTMLElement>(`[data-slot='${calendarGridSlot}']`);

    if (!dayGrid) return;

    grid.style.top = `${dayGrid.offsetTop}px`;
    grid.style.height = `${dayGrid.offsetHeight}px`;
  },
  { flush: "post" },
);

const focusYearCell = (year: number) => {
  element.value?.querySelector<HTMLElement>(`[data-year='${year}']`)?.focus();
};

let frame: number | undefined;

const cancelFrame = () => {
  if (frame != null) cancelAnimationFrame(frame);
  frame = undefined;
};

onScopeDispose(cancelFrame);

/*
 * Anchor keyboard focus on the way in only.
 *
 * Watching the open flag alone rather than the year list: the list is rebuilt whenever the calendar
 * moves, and re-anchoring on that would drag focus back off whichever year the user had arrowed to.
 */
watch(isYearPickerOpen, (isOpen) => {
  if (!isOpen || years.value.length === 0) return;

  const nextActiveYear = years.value.includes(focusedYear.value)
    ? focusedYear.value
    : years.value[0]!;

  activeYear.value = nextActiveYear;

  // A frame later, because the cells are hidden until the open state has been painted.
  cancelFrame();
  frame = requestAnimationFrame(() => {
    frame = undefined;
    focusYearCell(nextActiveYear);
  });
});

// A year the list no longer holds cannot stay active, or the arrows would have nowhere to start.
watch([years, isYearPickerOpen], ([list, isOpen]) => {
  if (!isOpen || list.length === 0) return;
  if (!list.includes(activeYear.value)) activeYear.value = list[0]!;
});

const selectYear = (year: number) => {
  const item = picker.items.value.find((entry) => entry.date.year === year);

  if (!item) return;

  setIsYearPickerOpen(false);
  picker.onChange(item.id);
};

/** Where each key moves within the grid, as an offset in the flat list of years. */
const STEPS: Record<string, number> = {
  ArrowDown: COLUMNS,
  ArrowLeft: -1,
  ArrowRight: 1,
  ArrowUp: -COLUMNS,
};

const onKeydown = (event: KeyboardEvent) => {
  if (event.key === "Escape" && isYearPickerOpen.value) {
    event.preventDefault();
    setIsYearPickerOpen(false);

    return;
  }

  if (!isYearPickerOpen.value || years.value.length === 0) return;

  const currentIndex = years.value.indexOf(activeYear.value);

  if (currentIndex === -1) return;

  const last = years.value.length - 1;
  const step = STEPS[event.key];
  let nextIndex = currentIndex;

  if (step != null) nextIndex = Math.min(Math.max(currentIndex + step, 0), last);
  else if (event.key === "Home") nextIndex = 0;
  else if (event.key === "End") nextIndex = last;
  else return;

  if (nextIndex === currentIndex) return;

  const nextYear = years.value[nextIndex];

  if (nextYear == null) return;

  event.preventDefault();
  activeYear.value = nextYear;
  focusYearCell(nextYear);
};

provideYearPickerGridContext({
  activeYear: computed(() => activeYear.value),
  focusedYear,
  getFormattedYear,
  isYearPickerOpen,
  selectYear,
  setActiveYear: (year) => {
    activeYear.value = year;
  },
  slots,
  years,
});
</script>

<template>
  <div
    ref="element"
    :aria-hidden="!isYearPickerOpen"
    :aria-label="picker.ariaLabel.value"
    :class="styles"
    :data-open="dataAttr(isYearPickerOpen)"
    data-slot="calendar-year-picker-grid"
    role="listbox"
    tabindex="-1"
    @keydown="onKeydown"
  >
    <slot />
  </div>
</template>
