<script setup lang="ts">
import { Splitter, SplitterHandle, SplitterPanel } from "ropav";
</script>

<template>
  <Splitter
    aria-label="Collapsible sidebar"
    class="h-56 w-full max-w-lg overflow-hidden rounded-xl border border-border"
  >
    <SplitterPanel
      class="grid h-full place-items-center text-sm"
      :collapsed-size="48"
      default-size="200px"
      is-collapsible
      min-size="160px"
    >
      Drag me shut
    </SplitterPanel>

    <SplitterHandle show-grip />

    <SplitterPanel class="grid h-full place-items-center text-sm">Editor</SplitterPanel>
  </Splitter>
</template>
