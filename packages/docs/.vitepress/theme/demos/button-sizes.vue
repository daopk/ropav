<script setup lang="ts">
import { Button } from "ropav";

const sizes = ["xs", "sm", "md", "lg"] as const;
</script>

<template>
  <Button v-for="size in sizes" :key="size" :size="size">{{ size }}</Button>
</template>
