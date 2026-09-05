<script setup lang="ts">
import { Link, LinkIcon } from "ropav";
</script>

<template>
  <Link href="https://github.com/daopk/ropav" rel="noopener noreferrer" target="_blank">
    Ropav on GitHub
    <LinkIcon />
  </Link>

  <Link href="#" is-disabled>
    Not available yet
    <LinkIcon />
  </Link>
</template>
