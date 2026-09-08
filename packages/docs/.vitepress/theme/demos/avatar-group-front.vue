<script setup lang="ts">
import { Avatar, AvatarGroup, AvatarGroupOverflow, AvatarImage } from "ropav";

// Data URIs so the demo needs nothing from the network.
const portrait = (fill: string) =>
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
       <rect width="64" height="64" fill="${fill}" />
       <circle cx="32" cy="25" r="12" fill="#ffffff" />
       <circle cx="32" cy="58" r="19" fill="#ffffff" />
     </svg>`,
  );

const members = [
  { id: 1, src: portrait("#0485f7") },
  { id: 2, src: portrait("#7c5cff") },
  { id: 3, src: portrait("#12a594") },
  { id: 4, src: portrait("#e5484d") },
];
</script>

<template>
  <AvatarGroup v-for="front in ['last', 'first'] as const" :key="front" :front="front">
    <Avatar v-for="member in members" :key="member.id">
      <AvatarImage :src="member.src" />
    </Avatar>
    <AvatarGroupOverflow :count="3" />
  </AvatarGroup>
</template>
