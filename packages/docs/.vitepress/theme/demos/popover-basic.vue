<script setup lang="ts">
import {
  Button,
  Popover,
  PopoverArrow,
  PopoverContent,
  PopoverDialog,
  PopoverHeading,
} from "ropav";
</script>

<template>
  <Popover>
    <Button variant="secondary">Share</Button>

    <PopoverContent placement="bottom">
      <PopoverArrow />
      <PopoverDialog class="dialog">
        <PopoverHeading>Share this project</PopoverHeading>
        <p class="note">Anyone with the link can read it. Nobody can edit.</p>
      </PopoverDialog>
    </PopoverContent>
  </Popover>
</template>

<style scoped>
.dialog {
  max-width: calc(var(--rp-spacing) * 64);
}

.note {
  color: var(--rp-muted);
  font-size: var(--rp-text-sm);
  line-height: var(--rp-text-sm--line-height);
}
</style>
