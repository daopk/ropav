<script setup lang="ts" vapor>
import type {CalendarCellProps, CalendarCellSlotProps} from "./calendar.types";

import {isSameMonth} from "@internationalized/date";
import {computed, shallowRef} from "vue";

import {useCalendarCell} from "../../composables/use-calendar-cell";
import {useInteractionStates} from "../../composables/use-interaction-states";
import {dataAttr} from "../../utils/assertion";

import {
  useCalendarContext,
  useCalendarGridContext,
  useCalendarStateContext,
} from "./calendar.context";

const props = defineProps<CalendarCellProps>();

defineSlots<{default?: (props: CalendarCellSlotProps) => unknown}>();

const {slots} = useCalendarContext();
const {calendar, state} = useCalendarStateContext();
const {startDate} = useCalendarGridContext();

const element = shallowRef<HTMLElement | null>(null);

/**
 * Whether this cell belongs to a neighbouring month.
 *
 * Only a month grid has the question: a day or week view shows exactly the dates it was asked for,
 * so none of them is out of place.
 */
const isOutsideMonth = computed(() => {
  const duration = state.visibleDuration.value;

  if (duration.days || duration.weeks) return false;

  return !isSameMonth(startDate.value, props.date);
});

const cell = useCalendarCell(
  {date: () => props.date, element, isOutsideMonth},
  state,
  calendar.shared,
);

// Hover and keyboard-focus rings are painted from these, and the stylesheet keys on the data
// attributes as well as on the pseudo-classes.
const interaction = useInteractionStates({
  isDisabled: () => cell.isDisabled.value || cell.isUnavailable.value,
});

// A ring only when the cell is the focused one: the browser's own focus can lag a page change.
const isFocusVisible = computed(() => interaction.isFocusVisible.value && cell.isFocused.value);

const styles = computed(() => slots.value.cell({class: props.class}));

const slotProps = computed<CalendarCellSlotProps>(() => ({
  date: props.date,
  formattedDate: cell.formattedDate.value,
  isDisabled: cell.isDisabled.value,
  isFocused: cell.isFocused.value,
  isFocusVisible: isFocusVisible.value,
  isHovered: interaction.isHovered.value,
  isInvalid: cell.isInvalid.value,
  isOutsideMonth: isOutsideMonth.value,
  isOutsideVisibleRange: cell.isOutsideVisibleRange.value,
  isPressed: cell.isPressed.value,
  isSelected: cell.isSelected.value,
  isToday: cell.isToday.value,
  isUnavailable: cell.isUnavailable.value,
}));
</script>

<template>
  <td v-bind="cell.cellAttrs.value">
    <div
      ref="element"
      :class="styles"
      :data-disabled="dataAttr(cell.isDisabled.value)"
      :data-focus-visible="dataAttr(isFocusVisible)"
      :data-focused="dataAttr(cell.isFocused.value)"
      :data-hovered="dataAttr(interaction.isHovered.value)"
      :data-invalid="dataAttr(cell.isInvalid.value)"
      :data-outside-month="dataAttr(isOutsideMonth)"
      :data-outside-visible-range="dataAttr(cell.isOutsideVisibleRange.value)"
      :data-pressed="dataAttr(cell.isPressed.value)"
      :data-selected="dataAttr(cell.isSelected.value)"
      data-slot="calendar-cell"
      :data-today="dataAttr(cell.isToday.value)"
      :data-unavailable="dataAttr(cell.isUnavailable.value)"
      v-bind="cell.buttonAttrs.value"
      @blur="interaction.onBlur"
      @click="cell.handlers.onClick"
      @contextmenu="cell.handlers.onContextmenu"
      @dragstart="cell.handlers.onDragstart"
      @focus="
        () => {
          interaction.onFocus();
          cell.handlers.onFocus();
        }
      "
      @keydown="cell.handlers.onKeydown"
      @mousedown="cell.handlers.onMousedown"
      @pointercancel="cell.handlers.onPointerleave"
      @pointerdown="
        (event: PointerEvent) => {
          interaction.onPointerdown(event);
          cell.handlers.onPointerdown(event);
        }
      "
      @pointerenter="
        (event: PointerEvent) => {
          interaction.onPointerenter(event);
          cell.handlers.onPointerenter(event);
        }
      "
      @pointerleave="
        (event: PointerEvent) => {
          interaction.onPointerleave();
          cell.handlers.onPointerleave(event);
        }
      "
      @pointerup="cell.handlers.onPointerup"
    >
      <slot v-bind="slotProps">{{ cell.formattedDate.value }}</slot>
    </div>
  </td>
</template>
