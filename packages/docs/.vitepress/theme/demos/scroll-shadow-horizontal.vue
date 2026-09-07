<script setup lang="ts">
import { Card, CardDescription, CardTitle, ScrollShadow } from "ropav";

const talks = [
  { time: "Today, 6:30 PM", title: "Bridging the future" },
  { time: "Tomorrow, 9:00 AM", title: "Rendering without a virtual DOM" },
  { time: "Tomorrow, 2:15 PM", title: "Colour on the web" },
  { time: "Friday, 11:00 AM", title: "Keyboards all the way down" },
];
</script>

<template>
  <Card class="frame">
    <ScrollShadow class="scroller" orientation="horizontal">
      <div class="track">
        <Card v-for="talk in talks" :key="talk.title" class="tile" variant="transparent">
          <CardTitle class="tile__title">{{ talk.title }}</CardTitle>
          <CardDescription class="tile__note">{{ talk.time }}</CardDescription>
        </Card>
      </div>
    </ScrollShadow>
  </Card>
</template>

<style scoped>
.frame {
  width: 100%;
  max-width: var(--container-md);
  padding: 0;
}

.scroller {
  padding: calc(var(--spacing) * 4);
}

.track {
  display: flex;
  width: max-content;
  gap: calc(var(--spacing) * 4);
}

.tile {
  min-width: calc(var(--spacing) * 44);
  padding: calc(var(--spacing) * 4);
}

.tile .tile__title {
  font-size: var(--text-sm);
  line-height: var(--text-sm--line-height);
}

.tile .tile__note {
  font-size: var(--text-xs);
  line-height: var(--text-xs--line-height);
}
</style>
