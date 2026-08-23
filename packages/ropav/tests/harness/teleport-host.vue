<script setup lang="ts" vapor>
const props = defineProps<{ isOpen?: boolean }>();
</script>

<template>
  <div data-slot="host">
    <Teleport v-if="props.isOpen" to="body">
      <div data-slot="overlay" role="dialog">Overlay content</div>
    </Teleport>
  </div>
</template>
