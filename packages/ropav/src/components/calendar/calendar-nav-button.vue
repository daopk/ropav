<script setup lang="ts" vapor>
import type { CalendarNavButtonProps } from "./calendar.types";

import { computed } from "vue";

import { useInteractionStates } from "../../composables/use-interaction-states";
import { dataAttr } from "../../utils/assertion";
import { IconChevronLeft, IconChevronRight } from "../icons";

import { useCalendarContext, useCalendarStateContext } from "./calendar.context";

const props = withDefaults(defineProps<CalendarNavButtonProps>(), { slot: "next" });

defineSlots<{ default?: () => unknown }>();

const { slots } = useCalendarContext();
const { calendar } = useCalendarStateContext();

const button = computed(() =>
  props.slot === "previous" ? calendar.prevButton : calendar.nextButton,
);

const styles = computed(() => slots.value.navButton({ class: props.class }));
const iconStyles = computed(() => slots.value.navButtonIcon());

// The stylesheet keys hover and press on data attributes as well as on the pseudo-classes, so the
// states have to be reported from here too.
const interaction = useInteractionStates({ isDisabled: () => button.value.isDisabled.value });

/*
 * The calendar takes focus back when the button under it goes disabled, which is what this reports.
 * A calendar paged to its last available month would otherwise drop focus to the document.
 */
const onFocus = () => {
  interaction.onFocus();
  button.value.onFocusChange(true);
};

const onBlur = () => {
  interaction.onBlur();
  button.value.onFocusChange(false);
};

const onClick = () => button.value.onPress();

/*
 * `slot` is bound from here rather than written in the template because Vue 2 read a literal `slot`
 * attribute as slot syntax, and the linter still flags either spelling. The vapor compiler passes it
 * straight through — measured in the DOM. React puts it there too, which is why it is kept.
 *
 * The label rides along because a union type in a template expression is parsed as a Vue filter.
 */
const attrs = computed(() => ({
  "aria-label": button.value.attrs.value["aria-label"] as string | undefined,
  slot: props.slot,
}));
</script>

<template>
  <button
    :class="styles"
    :data-disabled="dataAttr(button.isDisabled.value)"
    :data-focus-visible="dataAttr(interaction.isFocusVisible.value)"
    :data-hovered="dataAttr(interaction.isHovered.value)"
    :data-pressed="dataAttr(interaction.isPressed.value)"
    data-slot="calendar-nav-button"
    :disabled="button.isDisabled.value || undefined"
    type="button"
    v-bind="attrs"
    @blur="onBlur"
    @click="onClick"
    @focus="onFocus"
    @pointercancel="interaction.onPointerleave"
    @pointerdown="interaction.onPointerdown"
    @pointerenter="interaction.onPointerenter"
    @pointerleave="interaction.onPointerleave"
  >
    <slot>
      <IconChevronLeft
        v-if="props.slot === 'previous'"
        :class="iconStyles"
        data-slot="calendar-nav-button-icon"
      />
      <IconChevronRight v-else :class="iconStyles" data-slot="calendar-nav-button-icon" />
    </slot>
  </button>
</template>
