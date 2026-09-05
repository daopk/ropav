<script setup lang="ts">
import { CloseButton } from "ropav";
</script>

<template>
  <CloseButton aria-label="Dismiss notification" />

  <CloseButton aria-label="Remove tag">
    <svg aria-hidden="true" class="size-3.5" fill="none" viewBox="0 0 16 16">
      <path d="M4 8h8" stroke="currentColor" stroke-linecap="round" stroke-width="2" />
    </svg>
  </CloseButton>
</template>
