<script setup lang="ts">
import { Splitter, SplitterHandle, SplitterPanel } from "ropav";
</script>

<template>
  <Splitter aria-label="Collapsible sidebar" class="frame">
    <SplitterPanel
      class="pane"
      :collapsed-size="48"
      default-size="200px"
      is-collapsible
      min-size="160px"
    >
      Drag me shut
    </SplitterPanel>

    <SplitterHandle show-grip />

    <SplitterPanel class="pane">Editor</SplitterPanel>
  </Splitter>
</template>

<style scoped>
.frame {
  border-color: var(--border);
  height: calc(var(--spacing) * 56);
  width: 100%;
  max-width: var(--container-lg);
  overflow: hidden;
  border-radius: calc(var(--radius) * 1.5);
  border-style: solid;
  border-width: 1px;
}

.pane {
  display: grid;
  height: 100%;
  place-items: center;
  font-size: var(--text-sm);
  line-height: var(--text-sm--line-height);
}
</style>
