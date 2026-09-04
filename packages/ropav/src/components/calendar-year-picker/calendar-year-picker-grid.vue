<script setup lang="ts" vapor>
import type { YearPickerGridYear } from "./calendar-year-picker.context";
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

const years = computed<YearPickerGridYear[]>(() =>
  picker.items.value.map((item) => ({
    formatted: item.formatted,
    id: item.id,
    year: item.date.year,
  })),
);

const focusedId = computed(() => picker.value.value);
const activeId = shallowRef(focusedId.value);

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

const focusYearCell = (id: number) => {
  element.value?.querySelector<HTMLElement>(`[data-key='${id}']`)?.focus();
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

  const nextActiveId = years.value[focusedId.value] ? focusedId.value : years.value[0]!.id;

  activeId.value = nextActiveId;

  // A frame later, because the cells are hidden until the open state has been painted.
  cancelFrame();
  frame = requestAnimationFrame(() => {
    frame = undefined;
    focusYearCell(nextActiveId);
  });
});

// A year the list no longer holds cannot stay active, or the arrows would have nowhere to start.
watch([years, isYearPickerOpen], ([list, isOpen]) => {
  if (!isOpen || list.length === 0) return;
  if (!list[activeId.value]) activeId.value = list[0]!.id;
});

const selectYear = (id: number) => {
  if (!years.value[id]) return;

  setIsYearPickerOpen(false);
  picker.onChange(id);
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

  const current = activeId.value;

  if (!years.value[current]) return;

  const last = years.value.length - 1;
  const step = STEPS[event.key];
  let next = current;

  if (step != null) next = Math.min(Math.max(current + step, 0), last);
  else if (event.key === "Home") next = 0;
  else if (event.key === "End") next = last;
  else return;

  if (next === current) return;

  event.preventDefault();
  activeId.value = next;
  focusYearCell(next);
};

provideYearPickerGridContext({
  activeId: computed(() => activeId.value),
  focusedId,
  isYearPickerOpen,
  selectYear,
  setActiveId: (id) => {
    activeId.value = id;
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
