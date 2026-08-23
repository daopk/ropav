<script setup lang="ts" vapor>
import type {DisclosureGroupRootProps} from "./disclosure-group.types";
import type {DisclosureKey} from "../../composables/use-disclosure-group";

import {disclosureGroupVariants} from "@ropav/styles";
import {computed} from "vue";

import {useDisclosureGroup} from "../../composables/use-disclosure-group";
import {dataAttr} from "../../utils/assertion";

import {provideDisclosureGroupContext} from "./disclosure-group.context";

// `isDisabled` declares an explicit `undefined` default so an absent prop stays absent. Vue
// casts a missing Boolean prop to `false`, which a disclosure below would read as a caller
// saying "not disabled" rather than as no opinion at all.
const props = withDefaults(defineProps<DisclosureGroupRootProps>(), {
  allowsMultipleExpanded: undefined,
  isDisabled: undefined,
});

const emit = defineEmits<{
  expandedChange: [keys: Set<DisclosureKey>];
  "update:expandedKeys": [keys: Set<DisclosureKey>];
}>();

defineSlots<{default?: () => unknown}>();

const slots = computed(() => disclosureGroupVariants());

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

provideDisclosureGroupContext({group});
</script>

<template>
  <div
    :class="slots.base({class: props.class})"
    :data-disabled="dataAttr(group.isDisabled.value)"
    data-slot="disclosure-group"
  >
    <slot />
  </div>
</template>
