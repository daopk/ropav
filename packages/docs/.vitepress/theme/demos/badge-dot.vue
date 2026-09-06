<script setup lang="ts">
import { Avatar, AvatarFallback, Badge, BadgeAnchor } from "ropav";

const people = [
  { color: "success", initials: "AL", name: "Ada", status: "Online" },
  { color: "warning", initials: "GH", name: "Grace", status: "Away" },
  { color: "default", initials: "KJ", name: "Katherine", status: "Offline" },
] as const;
</script>

<template>
  <div v-for="person in people" :key="person.initials" class="flex items-center gap-3">
    <BadgeAnchor>
      <Avatar>
        <AvatarFallback>{{ person.initials }}</AvatarFallback>
      </Avatar>
      <Badge :color="person.color" placement="bottom-right" size="sm" />
    </BadgeAnchor>

    <span class="text-sm">{{ person.name }} — {{ person.status }}</span>
  </div>
</template>
