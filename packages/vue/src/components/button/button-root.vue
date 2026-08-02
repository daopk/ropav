<script setup lang="ts" vapor>
import type {ButtonRootProps} from "./button.types";

import {buttonVariants} from "@heroui/styles";
import {computed} from "vue";

import {useInteractionStates} from "../../composables/use-interaction-states";
import {dataAttr} from "../../utils/assertion";

const props = withDefaults(defineProps<ButtonRootProps>(), {type: "button"});

const emit = defineEmits<{click: [event: MouseEvent]}>();

defineSlots<{default?: () => unknown}>();

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
    :type="props.type"
    @blur="onBlur"
    @click="onClick"
    @focus="onFocus"
    @pointerdown="onPointerdown"
    @pointerenter="onPointerenter"
    @pointerleave="onPointerleave"
  >
    <slot />
  </button>
</template>
