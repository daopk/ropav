<script setup lang="ts">
import type { ControlSpec, PlaygroundState } from "../../playgrounds/types";

import ControlField from "./control-field.vue";

defineProps<{ controls: readonly ControlSpec[]; state: PlaygroundState }>();
</script>

<template>
  <div class="panel">
    <ControlField
      v-for="control in controls"
      :key="control.name"
      v-model="state[control.name]"
      :control
      :title="control.description"
    />
  </div>
</template>

<style scoped>
.panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}
</style>
