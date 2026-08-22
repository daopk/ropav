<script setup lang="ts" vapor>
import type {DisclosureBodyProps} from "./disclosure.types";

import {composeSlotClassName} from "../../utils/compose";

import {useDisclosureContext} from "./disclosure.context";

const props = defineProps<DisclosureBodyProps>();

defineSlots<{default?: () => unknown}>();

const {slots} = useDisclosureContext();
</script>

<template>
  <div :class="slots.body()" data-slot="disclosure-body">
    <div :class="composeSlotClassName(slots.bodyInner, props.class)">
      <slot />
    </div>
  </div>
</template>
