<script setup lang="ts" vapor>
import type {
  CalendarYearPickerCellProps,
  CalendarYearPickerCellSlotProps,
} from "./calendar-year-picker.types";

import { computed } from "vue";

import { useInteractionStates } from "../../composables/use-interaction-states";
import { dataAttr } from "../../utils/assertion";

import { useYearPickerGridContext } from "./calendar-year-picker.context";

const props = withDefaults(defineProps<CalendarYearPickerCellProps>(), {
  excludeFromTabOrder: undefined,
});

defineSlots<{ default?: (props: CalendarYearPickerCellSlotProps) => unknown }>();

const { activeId, focusedId, isYearPickerOpen, selectYear, setActiveId, slots, years } =
  useYearPickerGridContext();

const entry = computed(() => years.value[props.id]);
const year = computed(() => entry.value?.year ?? props.id);

/*
 * Reported through `data-selected` only, not `aria-selected`, which matches React: the year cells are
 * buttons rather than options, and RAC drops `aria-selected` on a button rather than emitting ARIA
 * the role does not allow.
 */
const isSelected = computed(() => props.id === focusedId.value);
const formattedYear = computed(() => entry.value?.formatted ?? String(year.value));
const styles = computed(() => slots.value.yearCell({ class: props.class }));

/**
 * Only one year is a tab stop, and only while the picker is open.
 *
 * The grid moves focus with the arrow keys, so every other cell has to be out of the tab order —
 * and while the picker is closed the whole list is, or Tab would walk through a hidden grid.
 */
const isExcludedFromTabOrder = computed(
  () => props.excludeFromTabOrder ?? !(isYearPickerOpen.value && props.id === activeId.value),
);

const interaction = useInteractionStates();

const slotProps = computed<CalendarYearPickerCellSlotProps>(() => ({
  formattedYear: formattedYear.value,
  id: props.id,
  isCurrentYear: year.value === new Date().getFullYear(),
  isOpen: isYearPickerOpen.value,
  isSelected: isSelected.value,
  selectYear: () => selectYear(props.id),
  year: year.value,
}));

const onFocus = () => {
  interaction.onFocus();
  setActiveId(props.id);
};
</script>

<template>
  <button
    :aria-label="formattedYear"
    :class="styles"
    :data-focus-visible="dataAttr(interaction.isFocusVisible.value)"
    :data-hovered="dataAttr(interaction.isHovered.value)"
    :data-key="props.id"
    :data-pressed="dataAttr(interaction.isPressed.value)"
    :data-selected="dataAttr(isSelected)"
    data-slot="calendar-year-picker-year-cell"
    :data-year="year"
    :tabindex="isExcludedFromTabOrder ? -1 : undefined"
    type="button"
    @blur="interaction.onBlur"
    @click="selectYear(props.id)"
    @focus="onFocus"
    @pointercancel="interaction.onPointerleave"
    @pointerdown="interaction.onPointerdown"
    @pointerenter="interaction.onPointerenter"
    @pointerleave="interaction.onPointerleave"
  >
    <slot v-bind="slotProps">{{ formattedYear }}</slot>
  </button>
</template>
