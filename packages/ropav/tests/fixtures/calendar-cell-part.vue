<script setup lang="ts" vapor>
import type { AnyCalendarState, CalendarShared } from "@/composables/use-calendar";
import type { UseCalendarCellReturn } from "@/composables/use-calendar-cell";
import type { CalendarDate } from "@internationalized/date";

import { shallowRef } from "vue";

import { useCalendarCell } from "@/composables/use-calendar-cell";

const props = defineProps<{
  date: CalendarDate;
  isOutsideMonth?: boolean;
  register: (date: string, cell: UseCalendarCellReturn) => void;
  shared: CalendarShared;
  state: AnyCalendarState;
}>();

const element = shallowRef<HTMLElement | null>(null);

const cell = useCalendarCell(
  { date: () => props.date, element, isOutsideMonth: () => props.isOutsideMonth },
  props.state,
  props.shared,
);

props.register(String(props.date), cell);
</script>

<template>
  <td data-slot="calendar-cell" v-bind="cell.cellAttrs.value">
    <div
      ref="element"
      :data-date="String(props.date)"
      :data-disabled="cell.isDisabled.value || undefined"
      :data-focused="cell.isFocused.value || undefined"
      :data-outside-month="props.isOutsideMonth || undefined"
      :data-pressed="cell.isPressed.value || undefined"
      :data-selected="cell.isSelected.value || undefined"
      data-slot="calendar-cell-button"
      :data-today="cell.isToday.value || undefined"
      :data-unavailable="cell.isUnavailable.value || undefined"
      v-bind="cell.buttonAttrs.value"
      @click="cell.handlers.onClick"
      @contextmenu="cell.handlers.onContextmenu"
      @dragstart="cell.handlers.onDragstart"
      @focus="cell.handlers.onFocus"
      @keydown="cell.handlers.onKeydown"
      @mousedown="cell.handlers.onMousedown"
      @pointercancel="cell.handlers.onPointerleave"
      @pointerdown="cell.handlers.onPointerdown"
      @pointerenter="cell.handlers.onPointerenter"
      @pointerleave="cell.handlers.onPointerleave"
      @pointerup="cell.handlers.onPointerup"
    >
      {{ cell.formattedDate.value }}
    </div>
  </td>
</template>
