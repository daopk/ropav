<script setup lang="ts" vapor>
import {useDropdownPopoverTarget} from "./dropdown.context";

/**
 * A way out of the overlay for a screen reader, ported from React Aria's `DismissButton`.
 *
 * There is no Escape key on a touch device, and a VoiceOver user swiping through the menu has no
 * other way to leave it. Hidden visually but not from assistive technology, and out of the tab
 * order, so it exists only for the users who need it.
 */
const {state} = useDropdownPopoverTarget();
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
      @click="state.close"
    />
  </div>
</template>
