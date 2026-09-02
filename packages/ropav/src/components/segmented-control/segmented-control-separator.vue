<script setup lang="ts" vapor>
import type { SegmentedControlSeparatorProps } from "./segmented-control.types";

import { composeSlotClassName } from "../../utils/compose";

import { useSegmentedControlContext } from "./segmented-control.context";

const props = defineProps<SegmentedControlSeparatorProps>();

const { slots } = useSegmentedControlContext();
</script>

<template>
  <span
    aria-hidden="true"
    :class="composeSlotClassName(slots.separator, props.class)"
    data-slot="segmented-control-separator"
  />
</template>
