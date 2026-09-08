<script setup lang="ts">
import { Avatar, AvatarFallback, AvatarGroup, Card, CardContent } from "ropav";

const members = ["JD", "KM", "EW"];
</script>

<template>
  <AvatarGroup>
    <Avatar v-for="member in members" :key="member">
      <AvatarFallback>{{ member }}</AvatarFallback>
    </Avatar>
  </AvatarGroup>

  <Card>
    <CardContent>
      <AvatarGroup style="--avatar-group-ring-color: var(--rp-surface)">
        <Avatar v-for="member in members" :key="member">
          <AvatarFallback>{{ member }}</AvatarFallback>
        </Avatar>
      </AvatarGroup>
    </CardContent>
  </Card>
</template>
