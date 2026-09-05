<script setup lang="ts">
import { Kbd, KbdAbbr, KbdContent } from "ropav";

const shortcuts = [
  { action: "Search", keys: ["command"], letter: "K" },
  { action: "Undo", keys: ["command"], letter: "Z" },
  { action: "Redo", keys: ["command", "shift"], letter: "Z" },
] as const;
</script>

<template>
  <dl class="flex flex-col gap-2 text-sm">
    <div v-for="shortcut in shortcuts" :key="shortcut.action" class="flex items-center gap-3">
      <dt class="w-16 text-muted">{{ shortcut.action }}</dt>
      <dd>
        <Kbd>
          <KbdAbbr v-for="key in shortcut.keys" :key="key" :key-value="key" />
          <KbdContent>{{ shortcut.letter }}</KbdContent>
        </Kbd>
      </dd>
    </div>
  </dl>
</template>
