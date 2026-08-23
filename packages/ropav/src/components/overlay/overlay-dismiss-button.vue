<script setup lang="ts" vapor>
/**
 * A way out of the overlay for a screen reader, ported from React Aria's `DismissButton`.
 *
 * There is no Escape key on a touch device, and a VoiceOver user swiping through the overlay has
 * no other way to leave it. Hidden visually but not from assistive technology, and out of the tab
 * order, so it exists only for the users who need it.
 *
 * The dismissal is passed in rather than read from a context, so a modal — which has no overlay
 * scope of its own — can render the same button.
 */
const props = defineProps<{ close: () => void }>();
</script>

<template>
  <div
    style="
      border: 0;
      clip-path: inset(50%);
      height: 1px;
      margin: -1px;
      overflow: hidden;
      padding: 0;
      position: absolute;
      white-space: nowrap;
      width: 1px;
    "
  >
    <button
      aria-label="Dismiss"
      style="width: 1px; height: 1px"
      tabindex="-1"
      @click="props.close()"
    />
  </div>
</template>
