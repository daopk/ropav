<script setup lang="ts" vapor>
import { Splitter, SplitterHandle, SplitterPanel } from "@/components/splitter";
</script>

<template>
  <Splitter aria-label="Outer" orientation="horizontal">
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
