<script setup lang="ts" vapor>
/*
 * The size is a prop rather than a fixed attribute so a caller can ask for `1em` and have the icon
 * follow the surrounding text — which is what the year-picker indicator needs. React's icons take it
 * the same way, by spreading props over their own defaults.
 */
withDefaults(defineProps<{ class?: string; height?: string | number; width?: string | number }>(), {
  class: undefined,
  height: 16,
  width: 16,
});
</script>

<template>
  <svg
    aria-hidden="true"
    :class="$props.class"
    fill="none"
    :height="$props.height"
    role="presentation"
    viewBox="0 0 16 16"
    :width="$props.width"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      clip-rule="evenodd"
      d="M5.47 2.97a.75.75 0 0 1 1.06 0l4.5 4.5a.75.75 0 0 1 0 1.06l-4.5 4.5a.75.75 0 1 1-1.06-1.06L9.44 8 5.47 4.03a.75.75 0 0 1 0-1.06Z"
      fill="currentColor"
      fill-rule="evenodd"
    />
  </svg>
</template>
