<script setup lang="ts">
import { computed } from "vue";

import { stories } from "../../generated/stories";

const props = defineProps<{ name: string }>();

const entry = computed(() => {
  const found = stories.find((story) => story.name === props.name);

  if (!found) throw new Error(`No story titled "${props.name}". Did \`pnpm generate\` run?`);

  return found;
});

/*
 * Empty unless the build was given one. A link to a `localhost` Storybook works for whoever
 * built the site and for nobody else, so with no address the name is rendered as plain text
 * rather than as a link that goes nowhere.
 */
const href = computed(() =>
  __STORYBOOK_URL__ ? `${__STORYBOOK_URL__}/?path=/docs/${entry.value.id}` : undefined,
);
</script>

<template>
  <a v-if="href" :href rel="noreferrer" target="_blank">{{ name }}</a>
  <span v-else class="storybook-link--offline">{{ name }}</span>
</template>

<style scoped>
.storybook-link--offline {
  color: var(--vp-c-text-2);
}
</style>
