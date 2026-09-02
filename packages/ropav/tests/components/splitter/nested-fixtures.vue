<script setup lang="ts" vapor>
import { Splitter, SplitterHandle, SplitterPanel } from "@/components/splitter";

const props = defineProps<{ class?: string }>();
</script>

<template>
  <Splitter aria-label="Outer" :class="props.class" orientation="horizontal">
    <SplitterPanel id="outer-start">Sidebar</SplitterPanel>
    <SplitterHandle id="outer-handle" />
    <SplitterPanel id="outer-end">
      <Splitter aria-label="Inner" orientation="vertical">
        <SplitterPanel id="inner-start">Editor</SplitterPanel>
        <SplitterHandle id="inner-handle" />
        <SplitterPanel id="inner-end">Console</SplitterPanel>
      </Splitter>
    </SplitterPanel>
  </Splitter>
</template>
