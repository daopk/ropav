<script setup lang="ts" vapor>
import type {ButtonRootProps, ButtonSlotProps} from "./button.types";

import {buttonVariants} from "@heroui/styles";
import {computed, watch} from "vue";

import {useInteractionStates} from "../../composables/use-interaction-states";
import {dataAttr} from "../../utils/assertion";
import {announce} from "../../utils/live-announcer";

const props = withDefaults(defineProps<ButtonRootProps>(), {type: "button"});

const emit = defineEmits<{click: [event: MouseEvent]}>();

defineSlots<{default?: (props: ButtonSlotProps) => unknown}>();

const styles = computed(() =>
  buttonVariants({
    class: props.class,
    fullWidth: props.fullWidth,
    isIconOnly: props.isIconOnly,
    size: props.size,
    variant: props.variant,
  }),
);

// The stylesheet keys hover, press and focus on these attributes, so they have to be
// rendered here rather than left to the native pseudo-classes.
const {
  isFocusVisible,
  isFocused,
  isHovered,
  isPressed,
  onBlur,
  onFocus,
  onPointerdown,
  onPointerenter,
  onPointerleave,
} = useInteractionStates({
  isDisabled: () => props.isDisabled,
  isPending: () => props.isPending,
});

// A pending button keeps its label and only changes an attribute, so the transition
// would otherwise pass a screen reader by. Announced only while focused, because that
// is when the change is part of what the user is doing.
watch(
  () => Boolean(props.isPending),
  (isPending) => {
    if (!isFocused.value) return;

    announce(isPending ? "pending" : "");
  },
);

// Blocking the click is not enough on its own: implicit submission reaches the form
// through the button's own type, without a click ever landing on the button.
const type = computed(() => (props.isPending && props.type === "submit" ? "button" : props.type));

const onClick = (event: MouseEvent) => {
  // A pending button stays focusable rather than `disabled`, so activation is blocked here.
  if (props.isPending) {
    event.preventDefault();

    return;
  }

  emit("click", event);
};
</script>

<template>
  <button
    :aria-disabled="props.isPending || undefined"
    :class="styles"
    :data-disabled="dataAttr(props.isDisabled)"
    :data-focus-visible="dataAttr(isFocusVisible)"
    :data-focused="dataAttr(isFocused)"
    :data-hovered="dataAttr(isHovered)"
    :data-pending="dataAttr(props.isPending)"
    :data-pressed="dataAttr(isPressed)"
    data-slot="button"
    :disabled="props.isDisabled || undefined"
    :type="type"
    @blur="onBlur"
    @click="onClick"
    @focus="onFocus"
    @pointerdown="onPointerdown"
    @pointerenter="onPointerenter"
    @pointerleave="onPointerleave"
  >
    <slot
      :is-disabled="Boolean(props.isDisabled)"
      :is-focus-visible="isFocusVisible"
      :is-hovered="isHovered"
      :is-pending="Boolean(props.isPending)"
      :is-pressed="isPressed"
    />
  </button>
</template>
