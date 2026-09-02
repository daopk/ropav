<script setup lang="ts" vapor>
import { virtualizerVariants } from "@ropav/styles";
import { computed } from "vue";

import VirtualizerScrollbarTrack from "./virtualizer-scrollbar-track.vue";
import { useVirtualizerStateContext } from "./virtualizer.context";

/**
 * The scrollbar a windowed collection draws for itself, in place of the native one it hides.
 *
 * A native thumb is moved by the compositor, which draws every frame at the new offset with
 * whatever rows the main thread last committed — and across a long collection those rows are
 * always somewhere else, so the window is empty for as long as the main thread takes to catch up.
 * This thumb is moved by the main thread: a pointer move sets the offset and the rows for it in
 * one task, so no frame is ever drawn with rows that were built for another offset. Wheel,
 * trackpad and keyboard scrolling stay native, and the thumb follows them.
 *
 * A pointer affordance and nothing more, like the native one: the box stays the focusable
 * scroller and the keyboard reaches every offset through it. Hidden from assistive technology for
 * the same reason a native scrollbar is not exposed.
 *
 * Rendered by the collection as the first child of its content wrapper — inside the wrapper rather
 * than beside it, because a stuck box cannot leave its containing block, and only the wrapper is
 * tall enough to stay stuck to for the whole of the scroll. A stuck box is held inside the scroll
 * container's content box, so on a padded container it sits at the content's corner, not the
 * container's; the difference is the padding, and it is given back with a translation, which
 * sticky positioning leaves alone. A track along the edge then runs the full length of the box.
 */
const state = useVirtualizerStateContext();

if (!state) {
  throw new Error("`VirtualizerScrollbar` was rendered outside of a windowed collection.");
}

const { scroll } = state;
const styles = virtualizerVariants();

const style = computed(() => {
  const { direction, paddingInlineStart, paddingTop } = scroll.box.value;
  // Towards the inline start: leftwards in a left-to-right box, rightwards in the other.
  const inline = direction === "rtl" ? paddingInlineStart : -paddingInlineStart;

  return {
    translate: `${inline}px ${-paddingTop}px`,
    width: `${scroll.size.value.width}px`,
  };
});
</script>

<template>
  <div
    aria-hidden="true"
    :class="styles.scrollbar()"
    data-slot="virtualizer-scrollbar"
    :style="style"
  >
    <VirtualizerScrollbarTrack orientation="vertical" />
    <VirtualizerScrollbarTrack orientation="horizontal" />
  </div>
</template>
