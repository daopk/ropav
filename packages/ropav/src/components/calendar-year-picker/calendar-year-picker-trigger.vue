<script setup lang="ts" vapor>
import type {
  CalendarYearPickerTriggerProps,
  CalendarYearPickerTriggerSlotProps,
} from "./calendar-year-picker.types";

import {calendarYearPickerVariants} from "@ropav/styles";
import {computed} from "vue";

import {useCalendarHeading} from "../../composables/use-calendar-heading";
import {useInteractionStates} from "../../composables/use-interaction-states";
import {dataAttr} from "../../utils/assertion";
import {useCalendarStateContext} from "../calendar/calendar.context";

import {
  provideYearPickerTriggerContext,
  useYearPickerContext,
} from "./calendar-year-picker.context";

const props = defineProps<CalendarYearPickerTriggerProps>();

defineSlots<{default?: (props: CalendarYearPickerTriggerSlotProps) => unknown}>();

const {isYearPickerOpen, setIsYearPickerOpen} = useYearPickerContext();
const {state} = useCalendarStateContext();

const monthYear = useCalendarHeading({}, state);
const slots = computed(() => calendarYearPickerVariants());
const styles = computed(() => slots.value.trigger({class: props.class}));

const toggle = () => setIsYearPickerOpen(!isYearPickerOpen.value);

// Closing on Escape from the trigger as well as from the grid, because focus is still here after
// the trigger has opened the picker.
const onKeydown = (event: KeyboardEvent) => {
  if (event.key !== "Escape" || !isYearPickerOpen.value) return;

  event.preventDefault();
  setIsYearPickerOpen(false);
};

const interaction = useInteractionStates();

const slotProps = computed<CalendarYearPickerTriggerSlotProps>(() => ({
  isOpen: isYearPickerOpen.value,
  monthYear: monthYear.value,
  toggle,
}));

provideYearPickerTriggerContext({isOpen: isYearPickerOpen, monthYear, slots, toggle});
</script>

<template>
  <button
    :aria-expanded="isYearPickerOpen"
    :aria-label="`${monthYear}, year selector`"
    :class="styles"
    :data-focus-visible="dataAttr(interaction.isFocusVisible.value)"
    :data-hovered="dataAttr(interaction.isHovered.value)"
    :data-open="dataAttr(isYearPickerOpen)"
    :data-pressed="dataAttr(interaction.isPressed.value)"
    data-slot="calendar-year-picker-trigger"
    type="button"
    @blur="interaction.onBlur"
    @click="toggle"
    @focus="interaction.onFocus"
    @keydown="onKeydown"
    @pointercancel="interaction.onPointerleave"
    @pointerdown="interaction.onPointerdown"
    @pointerenter="interaction.onPointerenter"
    @pointerleave="interaction.onPointerleave"
  >
    <slot v-bind="slotProps" />
  </button>
</template>
