<script setup lang="ts" vapor>
import type {TooltipArrowProps} from "./tooltip.types";

import {IconOverlayArrow} from "../icons";
import {OverlayArrow} from "../overlay";

const props = defineProps<TooltipArrowProps>();

defineSlots<{default?: () => unknown}>();

// The default shape carries the slot the stylesheet keys `fill`, `stroke` and the placement
// rotation on. An arrow supplied through the slot has to carry it itself: vapor renders a slot as
// it is and offers no way to add an attribute to what came out of it.
//
// The explanation lives here rather than beside the markup because a comment in a template is
// rendered into the DOM.
</script>

<template>
  <OverlayArrow :class="props.class" data-slot="tooltip-arrow">
    <slot><IconOverlayArrow data-slot="overlay-arrow" /></slot>
  </OverlayArrow>
</template>
