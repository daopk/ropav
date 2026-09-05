<script setup lang="ts">
import type { PlaygroundNode, PlaygroundState } from "../../playgrounds/types";

import { computed } from "vue";

import { parts } from "./registry";

const props = defineProps<{ node: PlaygroundNode; state: PlaygroundState }>();

const component = computed(() => parts[props.node.tag]);

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
  <component :is="component" v-bind="bound">
    <template v-for="(child, index) in node.children ?? []" :key="index">
      <PreviewNode v-if="typeof child !== 'string'" :node="child" :state="state" />
      <template v-else>{{ child }}</template>
    </template>
  </component>
</template>
