<script setup lang="ts" vapor>
import type {
  CalendarYearPickerCellProps,
  CalendarYearPickerCellSlotProps,
} from "./calendar-year-picker.types";

import {computed} from "vue";

import {useInteractionStates} from "../../composables/use-interaction-states";
import {dataAttr} from "../../utils/assertion";

import {useYearPickerGridContext} from "./calendar-year-picker.context";

const props = withDefaults(defineProps<CalendarYearPickerCellProps>(), {
  excludeFromTabOrder: undefined,
});

defineSlots<{default?: (props: CalendarYearPickerCellSlotProps) => unknown}>();

const {
  activeYear,
  focusedYear,
  getFormattedYear,
  isYearPickerOpen,
  selectYear,
  setActiveYear,
  slots,
} = useYearPickerGridContext();

const isSelected = computed(() => props.year === focusedYear.value);
const formattedYear = computed(() => getFormattedYear(props.year));
const styles = computed(() => slots.value.yearCell({class: props.class}));

/**
 * Only one year is a tab stop, and only while the picker is open.
 *
 * The grid moves focus with the arrow keys, so every other cell has to be out of the tab order —
 * and while the picker is closed the whole list is, or Tab would walk through a hidden grid.
 */
const isExcludedFromTabOrder = computed(
  () => props.excludeFromTabOrder ?? !(isYearPickerOpen.value && props.year === activeYear.value),
);

const interaction = useInteractionStates();

const slotProps = computed<CalendarYearPickerCellSlotProps>(() => ({
  formattedYear: formattedYear.value,
  isCurrentYear: props.year === new Date().getFullYear(),
  isOpen: isYearPickerOpen.value,
  isSelected: isSelected.value,
  selectYear: () => selectYear(props.year),
  year: props.year,
}));

const onFocus = () => {
  interaction.onFocus();
  setActiveYear(props.year);
};
</script>

<template>
  <button
    :aria-label="formattedYear"
    :aria-selected="isSelected"
    :class="styles"
    :data-focus-visible="dataAttr(interaction.isFocusVisible.value)"
    :data-hovered="dataAttr(interaction.isHovered.value)"
    :data-pressed="dataAttr(interaction.isPressed.value)"
    :data-selected="dataAttr(isSelected)"
    data-slot="calendar-year-picker-year-cell"
    :data-year="props.year"
    :tabindex="isExcludedFromTabOrder ? -1 : undefined"
    type="button"
    @blur="interaction.onBlur"
    @click="selectYear(props.year)"
    @focus="onFocus"
    @pointercancel="interaction.onPointerleave"
    @pointerdown="interaction.onPointerdown"
    @pointerenter="interaction.onPointerenter"
    @pointerleave="interaction.onPointerleave"
  >
    <slot v-bind="slotProps">{{ formattedYear }}</slot>
  </button>
</template>
