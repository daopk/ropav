<script setup lang="ts">
import { Button, ButtonGroup, ButtonGroupSeparator } from "ropav";
</script>

<template>
  <ButtonGroup aria-label="File actions" orientation="vertical" variant="secondary">
    <Button>Duplicate</Button>
    <Button>
      <ButtonGroupSeparator />
      Rename
    </Button>
    <Button>
      <ButtonGroupSeparator />
      Archive
    </Button>
  </ButtonGroup>
</template>
