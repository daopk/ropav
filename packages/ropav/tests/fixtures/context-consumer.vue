<script setup lang="ts" vapor>
import { useGreetingContext } from "./context";

const { greeting } = useGreetingContext();
</script>

<template>
  <span data-testid="greeting">{{ greeting }}</span>
</template>
