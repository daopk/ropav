<script setup lang="ts">
import { Button } from "ropav";

const variants = [
  "primary",
  "secondary",
  "tertiary",
  "outline",
  "ghost",
  "danger",
  "danger-soft",
] as const;
</script>

<template>
  <Button v-for="variant in variants" :key="variant" :variant="variant">
    {{ variant }}
  </Button>
</template>
