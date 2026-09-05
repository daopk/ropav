<script setup lang="ts">
import { Button, IconPlus, IconSearch } from "ropav";
</script>

<template>
  <Button>
    <IconPlus />
    New item
  </Button>

  <Button variant="secondary">
    Search
    <IconSearch />
  </Button>

  <Button aria-label="Search" is-icon-only variant="ghost">
    <IconSearch />
  </Button>
</template>
