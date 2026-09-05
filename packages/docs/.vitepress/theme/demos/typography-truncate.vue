<script setup lang="ts">
import { Paragraph } from "ropav";
</script>

<template>
  <div class="w-64">
    <Paragraph truncate>
      A single line that runs past the width it was given, and stops with an ellipsis rather than
      wrapping.
    </Paragraph>
  </div>
</template>
