<script setup lang="ts">
defineProps<{ title?: string }>();

defineSlots<{ code?: () => unknown; default?: () => unknown }>();
</script>

<template>
  <figure class="demo">
    <!-- `.ropav-demo` sits on the preview alone. The prose styles are unlayered and reach
         `pre` and `code`, so a revert that took in the snippet below would strip its
         highlighting with them. -->
    <div class="ropav-demo demo__preview">
      <slot />
    </div>

    <details v-if="$slots['code']" class="demo__source">
      <summary>{{ title ?? "Source" }}</summary>
      <slot name="code" />
    </details>
  </figure>
</template>

<style scoped>
.demo {
  margin: 24px 0;
  overflow: hidden;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
}

.demo__preview {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: center;
  padding: 32px 24px;
  color: var(--foreground);
  background-color: var(--background);
}

.demo__source {
  border-top: 1px solid var(--vp-c-divider);
}

/* Outranks `.vp-doc summary`, which would otherwise add prose spacing to the toggle. */
.demo__source summary {
  padding: 8px 16px;
  margin: 0;
  font-size: 13px;
  font-weight: 500;
  color: var(--vp-c-text-2);
  cursor: var(--cursor-interactive, pointer);
  user-select: none;
}

.demo__source summary:hover {
  color: var(--vp-c-text-1);
}

.demo__source :deep(div[class*="language-"]) {
  margin: 0;
  border-radius: 0;
}
</style>
