<script setup lang="ts" vapor>
import { computed, shallowRef } from "vue";

import { providePressResponder } from "../../composables/press-responder";

import { useTableRowContext } from "./table.context";

defineSlots<{ default?: () => unknown }>();

const { ariaLabelledBy, isDisabled, isExpanded, toggle } = useTableRowContext();

const element = shallowRef<HTMLElement | null>(null);

/**
 * Turns whatever pressable sits inside into the row's expand control.
 *
 * Handed down rather than rendered here, the same way a dropdown hands its trigger down: the
 * chevron stays an ordinary `Button`, with its own variants, hover and press states, and only the
 * part that makes it an expand control comes from the row. React Aria does the same thing through
 * a `Button` with `slot="chevron"`.
 *
 * The name flips with the state, so it says what the press will do rather than what the row is —
 * React Aria's own en-US strings.
 */
providePressResponder({
  attrs: computed(() => ({
    "aria-label": isExpanded.value ? "Collapse" : "Expand",
    // Named by the row as well, so hearing it read out says which row is opening.
    "aria-labelledby": ariaLabelledBy.value || undefined,
    "data-expanded": isExpanded.value || undefined,
    // Left out of the tab order on purpose, matching react-aria's `excludeFromTabOrder`: the row
    // already answers the arrow keys, so a second tab stop per row would only make walking a
    // tree slower than it needs to be.
    tabindex: -1,
  })),
  handlers: computed(() => ({
    onClick: (event: MouseEvent) => {
      // The row would otherwise treat the same click as a selection.
      event.stopPropagation();
      if (!isDisabled.value) toggle();
    },
    onDragstart: () => {},
    onKeydown: () => {},
    onMousedown: () => {},
    // Focus stays where it was, which is react-aria's `preventFocusOnPress` on the same button.
    onPointerdown: (event: PointerEvent) => event.preventDefault(),
    onPointerenter: () => {},
    onPointerleave: () => {},
    onPointerup: () => {},
  })),
  isPressed: computed(() => false),
  registerElement: (next) => {
    element.value = next;
  },
});
</script>

<template>
  <slot />
</template>
