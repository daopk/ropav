<script setup lang="ts" vapor>
defineProps<{ class?: string }>();
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
      d="M1.75 8a.75.75 0 0 1 .75-.75h11a.75.75 0 0 1 0 1.5h-11A.75.75 0 0 1 1.75 8"
      fill="currentColor"
      fill-rule="evenodd"
    />
  </svg>
</template>
