<script setup lang="ts" vapor>
import type {AccordionRootProps} from "./accordion.types";
import type {DisclosureKey} from "../../composables/use-disclosure-group";

import {accordionVariants} from "@heroui/styles";
import {computed} from "vue";

import {useDisclosureGroup} from "../../composables/use-disclosure-group";

import {provideAccordionContext} from "./accordion.context";

const props = defineProps<AccordionRootProps>();

const emit = defineEmits<{
  expandedChange: [keys: Set<DisclosureKey>];
  "update:expandedKeys": [keys: Set<DisclosureKey>];
}>();

defineSlots<{default?: () => unknown}>();

const slots = computed(() => accordionVariants({variant: props.variant}));

const group = useDisclosureGroup({
  allowsMultipleExpanded: () => props.allowsMultipleExpanded,
  defaultExpandedKeys: props.defaultExpandedKeys,
  expandedKeys: () => props.expandedKeys,
  isDisabled: () => props.isDisabled,
  onExpandedChange: (keys) => {
    emit("expandedChange", keys);
    // Also emitted as an update event, so `v-model:expanded-keys` works.
    emit("update:expandedKeys", keys);
  },
});

provideAccordionContext({
  group,
  hideSeparator: computed(() => props.hideSeparator ?? false),
  slots,
});
</script>

<template>
  <div :class="slots.base({class: props.class})" data-slot="accordion">
    <slot />
  </div>
</template>
