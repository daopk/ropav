<script setup lang="ts">
import { ColorSwatch } from "ropav";

const alphas = [1, 0.75, 0.5, 0.25, 0];
</script>

<template>
  <ColorSwatch
    v-for="alpha in alphas"
    :key="alpha"
    :color="`rgba(4, 133, 247, ${alpha})`"
    shape="square"
    size="lg"
  />
</template>
