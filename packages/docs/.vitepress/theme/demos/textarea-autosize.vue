<script setup lang="ts">
import { TextArea } from "ropav";
</script>

<template>
  <div class="stack">
    <TextArea
      autosize
      class="field"
      :max-rows="6"
      :min-rows="2"
      placeholder="Grows from 2 rows up to 6"
    />
    <TextArea autosize class="field" :min-rows="3" placeholder="Grows without a cap" />
  </div>
</template>

<style scoped>
.stack {
  display: flex;
  flex-direction: column;
  gap: calc(var(--rp-spacing) * 4);
}

.field {
  width: 100%;
  max-width: var(--rp-container-sm);
}
</style>
