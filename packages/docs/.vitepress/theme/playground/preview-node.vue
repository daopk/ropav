<script setup lang="ts">
import type { PlaygroundNode, PlaygroundState } from "../../playgrounds/types";

import { computed } from "vue";

import { parts } from "./registry";

const props = defineProps<{ node: PlaygroundNode; state: PlaygroundState }>();

const component = computed(() => parts[props.node.tag]);

/**
 * A leaf is rendered with no default slot. Vue registers a slot from inner content at
 * compile time, so a `v-for` over nothing still hands the part `slots.default`. Parts
 * that branch on that — SelectValue, SelectIndicator, ComboBoxTrigger, and the same
 * pattern on Autocomplete — then skip the placeholder, the chosen text, and the
 * chevron. `v-if` inside one slot would leave the function in place.
 */
const hasChildren = computed(() => (props.node.children?.length ?? 0) > 0);

// Only the root is driven by the panel; a nested part carries what the catalogue wrote.
const bound = computed(() => {
  if (!props.node.root) return props.node.props;

  const live = Object.fromEntries(
    Object.entries(props.state).filter(([, value]) => value !== undefined),
  );

  return { ...props.node.props, ...live };
});
</script>

<template>
  <component v-if="!hasChildren" :is="component" v-bind="bound" />
  <component v-else :is="component" v-bind="bound">
    <template v-for="(child, index) in node.children" :key="index">
      <PreviewNode v-if="typeof child !== 'string'" :node="child" :state="state" />
      <template v-else>{{ child }}</template>
    </template>
  </component>
</template>
