<script setup lang="ts" vapor>
import type {DefaultDatePropsHostProps} from "./default-date-props.types";

import {useDefaultDateProps} from "@/composables/use-default-date-props";

const props = defineProps<DefaultDatePropsHostProps>();

props.onReady?.(
  useDefaultDateProps(
    () => props.value,
    () => props.granularity,
  ),
);
</script>

<template>
  <span data-slot="default-date-props-host" />
</template>
