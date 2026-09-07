<script setup lang="ts">
import { Alert, AlertContent, AlertDescription, AlertIndicator, AlertTitle, Button } from "ropav";
</script>

<template>
  <Alert class="alert" status="accent">
    <AlertIndicator />
    <AlertContent>
      <AlertTitle>A new version is available</AlertTitle>
      <AlertDescription>Refresh to pick up the latest fixes.</AlertDescription>
    </AlertContent>
    <Button size="sm">Refresh</Button>
  </Alert>
</template>

<style scoped>
.alert {
  width: 100%;
  max-width: var(--rp-container-xl);
}
</style>
