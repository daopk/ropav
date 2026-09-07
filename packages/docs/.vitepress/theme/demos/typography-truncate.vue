<script setup lang="ts">
import { Paragraph } from "ropav";
</script>

<template>
  <div class="frame">
    <Paragraph truncate>
      A single line that runs past the width it was given, and stops with an ellipsis rather than
      wrapping.
    </Paragraph>
  </div>
</template>

<style scoped>
.frame {
  width: calc(var(--rp-spacing) * 64);
}
</style>
