<script setup lang="ts" vapor>
import type {PopoverArrowProps} from "./popover.types";

import {IconOverlayArrow} from "../icons";
import {OverlayArrow} from "../overlay";

const props = defineProps<PopoverArrowProps>();

defineSlots<{default?: () => unknown}>();
</script>

<template>
  <OverlayArrow :class="props.class" data-slot="popover-overlay-arrow-group">
    <!--
      The default shape carries the slot the stylesheet keys `fill` and the placement rotation on.
      An arrow supplied through the slot has to carry it itself: vapor renders a slot as it is and
      offers no way to add an attribute to what came out of it.
    -->
    <slot><IconOverlayArrow data-slot="popover-overlay-arrow" /></slot>
  </OverlayArrow>
</template>
