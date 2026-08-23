<script setup lang="ts" vapor>
defineProps<{ class?: string }>();
</script>

<template>
  <span :class="$props.class" data-testid="custom-separator">/</span>
</template>
