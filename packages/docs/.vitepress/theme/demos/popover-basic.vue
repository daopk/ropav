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
      <PopoverDialog class="max-w-64">
        <PopoverHeading>Share this project</PopoverHeading>
        <p class="text-sm text-muted">Anyone with the link can read it. Nobody can edit.</p>
      </PopoverDialog>
    </PopoverContent>
  </Popover>
</template>
