<script setup lang="ts">
import type { ThemeId } from "@ropav/styles";

import { themeIds, themeLabels } from "@ropav/styles";
import { onMounted, ref, useId } from "vue";

const STORAGE_KEY = "ropav-palette";

// Mirrors the appearance control's own props: `row` is the labelled form, `screen` the one
// the nav drawer shows.
defineProps<{ row?: boolean; screen?: boolean }>();

const labelId = useId();

/**
 * Starts at the default on both sides, so the markup hydrates.
 *
 * The head script has already put the stored palette on `<html>` by first paint, which is
 * what the reader sees; this only catches the control's own label up to it.
 */
const palette = ref<ThemeId>(themeIds[0]);

const isThemeId = (value: string | undefined): value is ThemeId =>
  value !== undefined && (themeIds as readonly string[]).includes(value);

onMounted(() => {
  const current = document.documentElement.dataset["theme"];

  if (isThemeId(current)) palette.value = current;
});

const apply = (next: string) => {
  if (!isThemeId(next)) return;

  palette.value = next;
  document.documentElement.dataset["theme"] = next;

  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // A browser refusing storage still gets the palette for this page.
  }
};
</script>

<template>
  <div class="VPPalette" :class="row ? (screen ? 'screen' : 'row') : 'bar'">
    <p v-if="row" :id="labelId" class="text">Palette</p>

    <select
      :aria-label="row ? undefined : 'Palette'"
      :aria-labelledby="row ? labelId : undefined"
      class="palette-select"
      :value="palette"
      @change="apply(($event.target as HTMLSelectElement).value)"
    >
      <option v-for="id in themeIds" :key="id" :value="id">{{ themeLabels[id] }}</option>
    </select>
  </div>
</template>

<style scoped>
/* The bar form is hidden on narrow screens the way the appearance switch is: this slot sits
 * outside the nav's overflow engine, which only moves clusters that register themselves. */
.bar {
  display: none;
}

@media (min-width: 48rem) {
  .bar {
    display: flex;
    align-items: center;
  }
}

.screen {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 0.875rem 0.75rem 1rem;
  background-color: var(--vp-c-bg-soft);
  border-radius: 0.5rem;
}

.text {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--vp-c-text-2);
}

.screen .text {
  line-height: 2;
}

/* Chrome, not library surface — the site's own tokens, so the control stays put while the
 * palette it sets moves everything below it. */
.palette-select {
  padding: 0 1.375rem 0 0.5rem;
  font-size: 0.75rem;
  font-weight: 500;
  line-height: 1.5rem;
  color: var(--vp-c-text-1);
  appearance: none;
  cursor: pointer;
  background-color: var(--vp-c-bg-alt);
  background-image:
    linear-gradient(45deg, transparent 50%, currentcolor 50%),
    linear-gradient(135deg, currentcolor 50%, transparent 50%);
  background-repeat: no-repeat;
  background-position:
    right 0.75rem center,
    right 0.5rem center;
  background-size:
    0.25rem 0.25rem,
    0.25rem 0.25rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 0.5rem;
  transition: border-color 0.25s;
}

.palette-select:hover {
  border-color: var(--vp-c-brand-1);
}

.palette-select:focus-visible {
  outline: 2px solid var(--vp-c-brand-1);
  outline-offset: 2px;
}
</style>
