<script setup lang="ts">
import { ToggleButton } from "ropav";
import { shallowRef } from "vue";

const isFollowing = shallowRef(false);
</script>

<template>
  <ToggleButton :is-selected="isFollowing" @change="isFollowing = $event">
    <template #default="{ isSelected }">{{ isSelected ? "Following" : "Follow" }}</template>
  </ToggleButton>

  <ToggleButton default-selected variant="ghost">
    <template #default="{ isSelected }">{{ isSelected ? "Pinned" : "Pin" }}</template>
  </ToggleButton>
</template>
