<script setup lang="ts">
import { Card, CardContent, CardTitle } from "ropav";
</script>

<template>
  <Card
    v-for="variant in ['default', 'secondary', 'tertiary'] as const"
    :key="variant"
    class="w-52"
  >
    <CardTitle>{{ variant }}</CardTitle>
    <CardContent>Sits one step further back than the one before it.</CardContent>
  </Card>
</template>
