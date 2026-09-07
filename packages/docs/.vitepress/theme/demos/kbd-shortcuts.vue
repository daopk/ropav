<script setup lang="ts">
import { Kbd, KbdAbbr, KbdContent } from "ropav";

const shortcuts = [
  { action: "Search", keys: ["command"], letter: "K" },
  { action: "Undo", keys: ["command"], letter: "Z" },
  { action: "Redo", keys: ["command", "shift"], letter: "Z" },
] as const;
</script>

<template>
  <dl class="list">
    <div v-for="shortcut in shortcuts" :key="shortcut.action" class="row">
      <dt class="term">{{ shortcut.action }}</dt>
      <dd>
        <Kbd>
          <KbdAbbr v-for="key in shortcut.keys" :key="key" :key-value="key" />
          <KbdContent>{{ shortcut.letter }}</KbdContent>
        </Kbd>
      </dd>
    </div>
  </dl>
</template>

<style scoped>
.list {
  display: flex;
  flex-direction: column;
  gap: calc(var(--rp-spacing) * 2);
  font-size: var(--rp-text-sm);
  line-height: var(--rp-text-sm--line-height);
}

.row {
  display: flex;
  align-items: center;
  gap: calc(var(--rp-spacing) * 3);
}

.term {
  color: var(--rp-muted);
  width: calc(var(--rp-spacing) * 16);
}
</style>
