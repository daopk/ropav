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
  <Card class="w-full max-w-md p-0">
    <ScrollShadow class="p-4" orientation="horizontal">
      <div class="flex w-max gap-4">
        <Card v-for="talk in talks" :key="talk.title" class="min-w-44 p-4" variant="transparent">
          <CardTitle class="text-sm">{{ talk.title }}</CardTitle>
          <CardDescription class="text-xs">{{ talk.time }}</CardDescription>
        </Card>
      </div>
    </ScrollShadow>
  </Card>
</template>
