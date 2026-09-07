<script setup lang="ts" vapor>
import type { DisclosureBodyProps } from "./disclosure.types";

const props = defineProps<DisclosureBodyProps>();

defineSlots<{ default?: () => unknown }>();
</script>

<template>
  <div class="rp-disclosure__body" data-slot="disclosure-body">
    <div :class="['rp-disclosure__body-inner', props.class]">
      <slot />
    </div>
  </div>
</template>
