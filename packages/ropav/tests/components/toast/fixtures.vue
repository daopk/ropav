<script setup lang="ts" vapor>
import type {ToastFixtureProps} from "./fixtures.types";

import {ToastProvider} from "@/components/toast";

// Every optional prop declares an explicit `undefined` default: forwarding a `false` or a `0` that
// Vue cast from an absent prop would set the provider up differently than the test asked for.
const props = withDefaults(defineProps<ToastFixtureProps>(), {
  ariaLabel: undefined,
  class: undefined,
  gap: undefined,
  maxVisibleToasts: undefined,
  placement: undefined,
  scaleFactor: undefined,
  width: undefined,
});
</script>

<template>
  <ToastProvider
    :aria-label="props.ariaLabel"
    :class="props.class"
    :gap="props.gap"
    :max-visible-toasts="props.maxVisibleToasts"
    :placement="props.placement"
    :queue="props.queue"
    :scale-factor="props.scaleFactor"
    :width="props.width"
  />
</template>
