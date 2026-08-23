<script setup lang="ts" vapor>
import type { DisclosureHeadingProps } from "./disclosure.types";

import { composeSlotClassName } from "../../utils/compose";

import { useDisclosureContext } from "./disclosure.context";

const props = defineProps<DisclosureHeadingProps>();

defineSlots<{ default?: () => unknown }>();

const { slots } = useDisclosureContext();
</script>

<template>
  <h3 :class="composeSlotClassName(slots.heading, props.class)" data-slot="disclosure-heading">
    <slot />
  </h3>
</template>
