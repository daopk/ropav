<script setup lang="ts" vapor>
defineProps<{class?: string}>();
</script>

<template>
  <svg
    aria-hidden="true"
    :class="$props.class"
    fill="none"
    height="9"
    role="presentation"
    viewBox="0 0 7 7"
    width="9"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M1.20592 6.84333L0.379822 6.01723L4.52594 1.8672H1.37819L1.38601 0.731812H6.48742V5.83714H5.34421L5.35203 2.6933L1.20592 6.84333Z"
      fill="currentColor"
    />
  </svg>
</template>
