<script setup lang="ts">
import { computed } from "vue";

import { stories } from "../../generated/stories";

import StorybookLink from "./storybook-link.vue";

/** The categories a component was filed under in Storybook, in the order they read best. */
const ORDER = [
  "Buttons",
  "Forms",
  "Pickers",
  "Collections",
  "Controls",
  "Overlays",
  "Navigation",
  "Layout",
  "Feedback",
  "Data Display",
  "Date and Time",
  "Colors",
  "Media",
  "Utilities",
];

const groups = computed(() => {
  const byCategory = new Map<string, typeof stories>();

  for (const story of stories) {
    const category = story.category || "Typography";

    byCategory.set(category, [...(byCategory.get(category) ?? []), story]);
  }

  return [...byCategory]
    .sort(([a], [b]) => {
      const left = ORDER.indexOf(a);
      const right = ORDER.indexOf(b);

      return (left < 0 ? ORDER.length : left) - (right < 0 ? ORDER.length : right);
    })
    .map(([category, entries]) => ({ category, entries }));
});
</script>

<template>
  <section v-for="group in groups" :key="group.category" class="index__group">
    <h2 :id="group.category.toLowerCase().replaceAll(' ', '-')">
      {{ group.category }}
      <a
        aria-hidden="true"
        class="header-anchor"
        :href="`#${group.category.toLowerCase().replaceAll(' ', '-')}`"
      />
    </h2>

    <ul class="index__list">
      <li v-for="entry in group.entries" :key="entry.title">
        <a v-if="entry.hasPage" :href="`/components/${entry.dir}`">{{ entry.name }}</a>
        <StorybookLink v-else :name="entry.name" />
      </li>
    </ul>
  </section>
</template>

<style scoped>
.index__group + .index__group {
  margin-top: 32px;
}

/* Outranks the prose list styles, which would indent it and stack the items. */
.index__list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(11rem, 1fr));
  gap: 4px 16px;
  padding: 0;
  margin: 16px 0 0;
  list-style: none;
}

.index__list li {
  margin: 0;
}
</style>
