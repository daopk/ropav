<script setup lang="ts">
import { Alert, AlertContent, AlertDescription, AlertIndicator, AlertTitle, Button } from "ropav";
</script>

<template>
  <Alert class="w-full max-w-xl" status="accent">
    <AlertIndicator />
    <AlertContent>
      <AlertTitle>A new version is available</AlertTitle>
      <AlertDescription>Refresh to pick up the latest fixes.</AlertDescription>
    </AlertContent>
    <Button size="sm">Refresh</Button>
  </Alert>
</template>
