<script setup lang="ts" vapor>
import type { SelectClearButtonProps } from "./select.types";

import { computed, onMounted, onUnmounted } from "vue";

import { dataAttr } from "../../utils/assertion";
import { IconClose } from "../icons";

import { useSelectContext } from "./select.context";

const props = defineProps<SelectClearButtonProps>();

const { isDisabled, onClear, registerClearButton, select, selectedItems, slots, state } =
  useSelectContext();

const styles = computed(() => slots.value.clearButton({ class: props.class }));

/**
 * Whether there is nothing to clear, which is what the stylesheet fades this out on.
 *
 * It stays in the DOM either way: appearing and disappearing would reflow the trigger every time
 * a choice was made or undone.
 *
 * Read from the chosen items rather than the selected keys, so this agrees with what the trigger
 * shows: a value naming an option the collection does not hold renders as the placeholder, and a
 * button offering to clear what the user cannot see is a button offering to clear nothing.
 */
const isEmpty = computed(() => selectedItems.value.length === 0);

/*
 * A span, not a button. The trigger this sits inside is a `button`, and a button inside a button
 * is invalid HTML — the browser closes the outer one early and the markup stops being the trigger
 * at all. The cost is that ARIA treats a button's children as presentational, so this can never
 * take focus; registering it is what opens the trigger's Backspace/Delete shortcut, which is the
 * keyboard's way in.
 */
let unregister: (() => void) | undefined;

onMounted(() => {
  unregister = registerClearButton();
});

onUnmounted(() => {
  unregister?.();
  unregister = undefined;
});

/**
 * Keeps the press off the trigger, so clearing does not also open the popover.
 *
 * Guarded the same way the click is: with nothing to clear the stylesheet takes this out of the
 * hit test, and a press swallowed here rather than there would leave a strip of the trigger that
 * neither clears nor opens.
 */
const onPointerdown = (event: PointerEvent) => {
  if (isDisabled.value || isEmpty.value) return;

  event.stopPropagation();
};

const onClick = (event: MouseEvent) => {
  event.stopPropagation();

  // Here rather than on pointer down, so only a primary press clears: `pointerdown` fires for
  // the secondary and middle buttons too.
  if (isDisabled.value || isEmpty.value) return;

  state.clearValue();
  onClear();

  // By hand, because both halves of the trigger's own focusing are gone: the press never reaches
  // it, while its `mousedown` still runs the `preventDefault` that keeps the browser from
  // focusing it. Without this the Backspace shortcut this button stands in for has nothing to
  // land on, and the next Tab starts from the top of the document.
  select.triggerElement.value?.focus();
};
</script>

<template>
  <span
    aria-hidden="true"
    :class="styles"
    :data-empty="dataAttr(isEmpty)"
    data-slot="select-clear-button"
    @click="onClick"
    @pointerdown="onPointerdown"
  >
    <slot><IconClose data-slot="select-clear-button-icon" /></slot>
  </span>
</template>
