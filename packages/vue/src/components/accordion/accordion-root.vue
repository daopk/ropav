<script setup lang="ts" vapor>
import type {AccordionRootProps} from "./accordion.types";
import type {DisclosureKey} from "../../composables/use-disclosure-group";

import {accordionVariants} from "@heroui/styles";
import {computed} from "vue";

import {useDisclosureGroup} from "../../composables/use-disclosure-group";
import {provideSurfaceContext, useSurfaceContext} from "../surface";

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

// Only resolves to an ancestor, since `inject` cannot see the component's own `provide`.
const ancestorSurface = useSurfaceContext();

/**
 * Only the surface variant paints a surface, so only it changes what descendants sit on;
 * every other variant forwards whatever is behind the accordion. The colour reported is the
 * default surface rather than the accordion's own variant, matching what the CSS paints.
 *
 * The choice lives inside the computed because `provide` runs once and the variant can
 * change afterwards.
 */
provideSurfaceContext({
  variant: computed(() =>
    props.variant === "surface" ? "default" : ancestorSurface?.variant.value,
  ),
});
</script>

<template>
  <div :class="slots.base({class: props.class})" data-slot="accordion">
    <slot />
  </div>
</template>
