<script setup lang="ts" vapor>
import { useOptionalContext } from "./context";

const { greeting } = useOptionalContext();
</script>

<template>
  <span data-testid="greeting">{{ greeting }}</span>
</template>
