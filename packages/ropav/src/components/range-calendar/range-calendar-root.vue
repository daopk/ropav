<script setup lang="ts" vapor>
import type {DateRange} from "../../composables/use-calendar";
import type {CalendarDayViewContext} from "../calendar/calendar.context";
import type {RangeCalendarRootProps, RangeCalendarRootSlotProps} from "./range-calendar.types";
import type {CalendarDate as CalendarDateValue, DateValue} from "@internationalized/date";

import {CalendarDate, DateFormatter, createCalendar} from "@internationalized/date";
import {rangeCalendarVariants} from "@ropav/styles";
import {computed, shallowRef} from "vue";

import {useControllableState} from "../../composables/use-controllable-state";
import {useLocale} from "../../composables/use-locale";
import {useRangeCalendar} from "../../composables/use-range-calendar";
import {useRangeCalendarState} from "../../composables/use-range-calendar-state";
import {dataAttr} from "../../utils/assertion";
import {getGregorianYearOffset} from "../../utils/calendar";
import {visuallyHiddenStyle} from "../../utils/visually-hidden";
import {provideYearPickerContext} from "../calendar-year-picker/calendar-year-picker.context";
import {provideCalendarStateContext} from "../calendar/calendar.context";

import {provideRangeCalendarContext, useRangeCalendarOwnerContext} from "./range-calendar.context";

/*
 * Every three-state boolean declares `default: undefined`. Vue casts an absent Boolean prop to
 * `false`, and a forwarded `false` is not the same as absent: `isInvalid: false` pins the calendar
 * as controlled-valid and shadows its own range validation entirely.
 */
const props = withDefaults(defineProps<RangeCalendarRootProps>(), {
  allowsNonContiguousRanges: undefined,
  autoFocus: undefined,
  defaultYearPickerOpen: false,
  isDisabled: undefined,
  isInvalid: undefined,
  isReadOnly: undefined,
  isYearPickerOpen: undefined,
});

const emit = defineEmits<{
  "update:value": [value: DateRange | null];
  "update:focusedValue": [value: CalendarDate];
  "update:yearPickerOpen": [isOpen: boolean];
}>();

defineSlots<{default?: (props: RangeCalendarRootSlotProps) => unknown}>();

const slots = computed(() => rangeCalendarVariants());
const element = shallowRef<HTMLElement | null>(null);
const locale = useLocale();

/**
 * A picker above, when there is one, which holds the range and the bounds this calendar draws.
 *
 * A prop written on the calendar itself always wins — the story labels the calendar in markup
 * while leaving everything else to the picker.
 */
const owner = useRangeCalendarOwnerContext();
const owned = computed(() => owner?.props.value ?? {});

/*
 * Left absent when neither this calendar nor the picker above it has a predicate, which is not the
 * same as one that always answers false: the state only walks to a neighbouring available date when
 * it has a predicate at all, and otherwise hands the date straight back.
 */
const hasDateUnavailable = Boolean(props.isDateUnavailable ?? owned.value.isDateUnavailable);
const isDateUnavailable = hasDateUnavailable
  ? (date: DateValue, anchorDate: CalendarDateValue | null) =>
      Boolean((props.isDateUnavailable ?? owned.value.isDateUnavailable)?.(date, anchorDate))
  : undefined;

/**
 * Default bounds spanning 1900 to 2099, expressed in the locale's own calendar system.
 *
 * Without them the year picker would have nothing to size itself against. The offset is what keeps
 * "1900" the same stretch of real time in a Buddhist or Hebrew calendar rather than a year nobody
 * recognises.
 */
const calendarSystem = computed(() =>
  createCalendar(
    new DateFormatter(locale.value.locale).resolvedOptions().calendar as Parameters<
      typeof createCalendar
    >[0],
  ),
);

const yearOffset = computed(() => getGregorianYearOffset(calendarSystem.value.identifier));

const minValue = computed(
  () =>
    props.minValue ??
    owned.value.minValue ??
    new CalendarDate(calendarSystem.value, 1900 + yearOffset.value, 1, 1),
);
const maxValue = computed(
  () =>
    props.maxValue ??
    owned.value.maxValue ??
    new CalendarDate(calendarSystem.value, 2099 + yearOffset.value, 12, 31),
);

const state = useRangeCalendarState({
  allowsNonContiguousRanges: () =>
    props.allowsNonContiguousRanges ?? owned.value.allowsNonContiguousRanges,
  autoFocus: () => props.autoFocus ?? owned.value.autoFocus,
  createCalendar,
  defaultFocusedValue: () => props.defaultFocusedValue ?? owned.value.defaultFocusedValue,
  defaultValue: () => props.defaultValue,
  firstDayOfWeek: () => props.firstDayOfWeek ?? owned.value.firstDayOfWeek,
  focusedValue: () => props.focusedValue,
  isDateUnavailable,
  isDisabled: () => props.isDisabled ?? owned.value.isDisabled,
  isInvalid: () => props.isInvalid ?? owned.value.isInvalid,
  isReadOnly: () => props.isReadOnly ?? owned.value.isReadOnly,
  maxValue,
  minValue,
  onChange: (value) => {
    emit("update:value", value);
    owned.value.onChange?.(value);
  },
  onFocusChange: (date) => emit("update:focusedValue", date),
  pageBehavior: () => props.pageBehavior ?? owned.value.pageBehavior,
  selectionAlignment: () => props.selectionAlignment,
  value: () => props.value ?? owned.value.value,
  visibleDuration: () => props.visibleDuration,
  weeksInMonth: () => props.weeksInMonth,
});

const calendar = useRangeCalendar(
  {
    ariaDescribedby: () => props.ariaDescribedby,
    ariaDetails: () => props.ariaDetails,
    ariaLabel: () => props.ariaLabel ?? owned.value.ariaLabel,
    ariaLabelledby: () => props.ariaLabelledby,
    commitBehavior: () => props.commitBehavior,
    element,
    id: () => props.id,
    isDisabled: () => props.isDisabled ?? owned.value.isDisabled,
    isInvalid: () => props.isInvalid ?? owned.value.isInvalid,
  },
  state,
);

const {setState: setIsYearPickerOpen, state: isYearPickerOpen} = useControllableState<boolean>({
  defaultValue: props.defaultYearPickerOpen,
  onValueChange: (isOpen) => emit("update:yearPickerOpen", isOpen),
  value: () => props.isYearPickerOpen,
});

const dayView = computed<CalendarDayViewContext | undefined>(() => {
  const days = props.visibleDuration?.days;

  if (days == null) return undefined;

  return {
    days,
    firstDayOfWeek: props.firstDayOfWeek,
    timeZone: state.timeZone.value,
    visibleRange: state.visibleRange.value,
  };
});

/**
 * The two raw modifiers, appended rather than declared as variants.
 *
 * They are not in the slot map because the stylesheet keys layout on them directly: a week view
 * lays its single row out differently from a month grid, and a day view differently again.
 */
const styles = computed(() =>
  slots.value.base({
    class: [
      props.visibleDuration?.weeks != null && "range-calendar--week-view",
      props.visibleDuration?.days != null && "range-calendar--day-view",
      props.class,
    ]
      .filter(Boolean)
      .join(" "),
  }),
);

const slotProps = computed<RangeCalendarRootSlotProps>(() => ({
  isDisabled: props.isDisabled ?? owned.value.isDisabled ?? false,
  isInvalid: state.isValueInvalid.value,
  state,
}));

/*
 * Two screen-reader-only elements bracket the slot.
 *
 * The first is a description of the whole visible range, placed before everything so a touch screen
 * reader user meets it first — and it repeats the calendar's own name, because VoiceOver on iOS does
 * not announce a grid's label. The second is another next button after the grid, so reaching the end
 * of a month can page on without swiping all the way back to the start.
 *
 * That second button carries `type="button"`, which React's does not. A `<button>` with no type
 * submits, so React's would submit any form the calendar sits inside — the one place this port
 * deliberately does not reproduce what React renders.
 *
 * The state context is the single calendar's, not one of its own: the grid, the cells and the year
 * picker are written against whichever calendar is above them, which is what lets them be written
 * once. react-aria keeps two contexts and every consumer reads both, taking whichever is not null.
 */
provideCalendarStateContext({calendar, state});
provideRangeCalendarContext({dayView, slots});
provideYearPickerContext({
  calendarElement: element,
  calendarGridSlot: "range-calendar-grid",
  isYearPickerOpen: computed(() => isYearPickerOpen.value),
  setIsYearPickerOpen,
});
</script>

<template>
  <div
    ref="element"
    :class="styles"
    :data-disabled="dataAttr(props.isDisabled ?? owned.isDisabled)"
    :data-invalid="dataAttr(state.isValueInvalid.value)"
    data-slot="range-calendar"
    v-bind="calendar.attrs.value"
    @focusout="calendar.handlers.onFocusout"
  >
    <div :style="visuallyHiddenStyle">
      <h2>{{ calendar.attrs.value["aria-label"] }}</h2>
    </div>
    <slot v-bind="slotProps" />
    <div :style="visuallyHiddenStyle">
      <button
        :aria-label="calendar.nextButton.attrs.value['aria-label'] as string"
        :disabled="calendar.nextButton.isDisabled.value || undefined"
        tabindex="-1"
        type="button"
        @click="state.focusNextPage()"
      />
    </div>
  </div>
</template>
