<script setup lang="ts" vapor>
import type {LabelsHostProps} from "./labels.types";

import {useLabels} from "@/composables/use-labels";

const props = defineProps<LabelsHostProps>();

props.onReady?.(
  useLabels(
    () => ({
      "aria-label": props.ariaLabel,
      "aria-labelledby": props.ariaLabelledby,
      id: props.id,
    }),
    () => props.defaultLabel,
  ),
);
</script>

<template>
  <span data-slot="labels-host" />
</template>
