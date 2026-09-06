<script setup lang="ts">
import { Separator, Typography } from "ropav";

const links = ["Blog", "Docs", "Source"] as const;
</script>

<template>
  <div class="w-full max-w-md">
    <Typography type="h4">Ropav</Typography>
    <Typography class="text-muted" type="body-sm">A component library for Vue.</Typography>

    <Separator class="my-4" />

    <div class="flex h-5 items-center gap-4">
      <template v-for="(link, index) in links" :key="link">
        <Separator v-if="index > 0" orientation="vertical" />
        <Typography type="body-sm">{{ link }}</Typography>
      </template>
    </div>
  </div>
</template>
