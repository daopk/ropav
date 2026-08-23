<script setup lang="ts" vapor>
import type {PointerType} from "../../composables/use-press";
import type {TableDragHandleProps} from "./table.types";

import {computed, shallowRef} from "vue";

import {providePressResponder} from "../../composables/press-responder";
import {isVirtualClick, isVirtualPointerEvent} from "../../composables/use-press";

import {useTableRowContext} from "./table.context";

const props = defineProps<TableDragHandleProps>();

defineSlots<{default?: () => unknown}>();

const {drag} = useTableRowContext();

const element = shallowRef<HTMLElement | null>(null);

/** How the last press reached this control, which is the only thing that decides what it does. */
let pointerType: PointerType = "mouse";

/**
 * Turns whatever pressable sits inside into the row's drag control.
 *
 * Handed down rather than rendered here, the same way `Table.ExpandTrigger` does it: the grip
 * stays an ordinary `Button` with its own variants and states, and only the part that makes it a
 * drag control comes from the row.
 *
 * **It exists for keyboard and screen reader users, not for the mouse.** The row itself is what
 * the browser drags, and a control sitting on top of it would swallow the press that starts the
 * drag — so `pointer-events: none` lets a mouse fall straight through to the row. Keyboard
 * activation and a screen reader's synthetic click both bypass hit testing, so they still land
 * here. This is React Aria's arrangement for the same button, for the same reason.
 */
providePressResponder({
  attrs: computed(() => ({
    ...drag?.dragButtonAttrs.value,
    "aria-label": props.ariaLabel ?? drag?.dragButtonAttrs.value["aria-label"],
    // A row nobody may drag has nothing for this control to do, and leaving it tabbable would
    // add a dead stop to every row.
    disabled: drag?.dragButtonAttrs.value.isDisabled || undefined,
    // Visible, and deliberately not a hit target — see above. This is a style, not a listener,
    // so the rule against spreading `on*` keys through `v-bind` does not apply to it.
    style: {pointerEvents: "none"},
  })),
  handlers: computed(() => ({
    onClick: (event: MouseEvent) => {
      const resolved = isVirtualClick(event) ? "virtual" : pointerType;

      if (resolved !== "keyboard" && resolved !== "virtual") return;

      // The row would otherwise treat the same click as a selection.
      event.preventDefault();
      event.stopPropagation();
      drag?.onDragButtonPress({
        altKey: event.altKey,
        continuePropagation: () => {},
        ctrlKey: event.ctrlKey,
        metaKey: event.metaKey,
        pointerType: resolved,
        shiftKey: event.shiftKey,
        shouldStopPropagation: true,
        target: (event.currentTarget as Element | null) ?? element.value!,
        type: "press",
      });
    },
    onDragstart: () => {},
    // Enter and Space on a button produce a click of their own; this is only what tells that
    // click apart from a mouse one, since both arrive with no pointer behind them.
    onKeydown: (event: KeyboardEvent) => {
      if (event.key === "Enter" || event.key === " ") pointerType = "keyboard";
    },
    onMousedown: () => {},
    onPointerdown: (event: PointerEvent) => {
      pointerType = isVirtualPointerEvent(event) ? "virtual" : (event.pointerType as PointerType);
    },
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
