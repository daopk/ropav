<script setup lang="ts" vapor>
defineProps<{class?: string}>();
</script>

<template>
  <svg
    aria-hidden="true"
    :class="$props.class"
    fill="none"
    height="16"
    role="presentation"
    viewBox="0 0 16 16"
    width="16"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      clip-rule="evenodd"
      d="M13.03 10.53a.75.75 0 0 1-1.06 0L8 6.56l-3.97 3.97a.75.75 0 0 1-1.06-1.06l4.5-4.5a.75.75 0 0 1 1.06 0l4.5 4.5a.75.75 0 0 1 0 1.06"
      fill="currentColor"
      fill-rule="evenodd"
    />
  </svg>
</template>
