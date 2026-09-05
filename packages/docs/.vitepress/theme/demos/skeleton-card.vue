<script setup lang="ts">
import { Card, Skeleton } from "ropav";
</script>

<template>
  <Card class="flex w-56 flex-col gap-5">
    <Skeleton class="h-24 rounded-xl" />
    <div class="flex flex-col gap-3">
      <Skeleton class="h-3 w-3/5 rounded-lg" />
      <Skeleton class="h-3 w-4/5 rounded-lg" />
      <Skeleton class="h-3 w-2/5 rounded-lg" />
    </div>
  </Card>
</template>
