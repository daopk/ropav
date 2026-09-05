<script setup lang="ts">
import { Surface, Typography } from "ropav";
</script>

<template>
  <Surface class="flex w-full max-w-sm flex-col gap-3 rounded-2xl p-5">
    <Typography type="h4">Billing</Typography>

    <Surface class="flex flex-col gap-2 rounded-xl p-4" variant="secondary">
      <Typography type="body-sm">Card ending 4242</Typography>

      <Surface class="rounded-lg p-3" variant="tertiary">
        <Typography color="muted" type="body-xs">Next charge on 1 October</Typography>
      </Surface>
    </Surface>
  </Surface>
</template>
