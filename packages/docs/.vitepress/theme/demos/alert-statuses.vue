<script setup lang="ts">
import { Alert, AlertContent, AlertDescription, AlertIndicator, AlertTitle } from "ropav";

const statuses = [
  { description: "Dark mode and a reworked focus ring.", status: "accent", title: "Update ready" },
  { description: "Your invoice has been paid.", status: "success", title: "Payment received" },
  { description: "Two seats remain on this plan.", status: "warning", title: "Nearly full" },
  { description: "The last sync did not complete.", status: "danger", title: "Sync failed" },
] as const;
</script>

<template>
  <div class="stack">
    <Alert v-for="entry in statuses" :key="entry.status" :status="entry.status">
      <AlertIndicator />
      <AlertContent>
        <AlertTitle>{{ entry.title }}</AlertTitle>
        <AlertDescription>{{ entry.description }}</AlertDescription>
      </AlertContent>
    </Alert>
  </div>
</template>

<style scoped>
.stack {
  display: flex;
  width: 100%;
  max-width: var(--container-xl);
  flex-direction: column;
  gap: calc(var(--rp-spacing) * 3);
}
</style>
