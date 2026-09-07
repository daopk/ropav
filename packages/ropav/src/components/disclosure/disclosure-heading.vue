<script setup lang="ts" vapor>
import type { DisclosureHeadingProps } from "./disclosure.types";

const props = defineProps<DisclosureHeadingProps>();

defineSlots<{ default?: () => unknown }>();
</script>

<template>
  <h3 :class="['rp-disclosure__heading', props.class]" data-slot="disclosure-heading">
    <slot />
  </h3>
</template>
