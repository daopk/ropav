<script setup lang="ts">
import { Label, Menu, MenuItem, Separator, Surface } from "ropav";
</script>

<template>
  <Surface class="w-56 p-0">
    <Menu aria-label="File actions">
      <MenuItem id="new" text-value="New file">
        <Label>New file</Label>
      </MenuItem>
      <MenuItem id="copy" text-value="Copy link">
        <Label>Copy link</Label>
      </MenuItem>

      <Separator />

      <MenuItem id="delete" text-value="Delete file" variant="danger">
        <Label>Delete file</Label>
      </MenuItem>
    </Menu>
  </Surface>
</template>
