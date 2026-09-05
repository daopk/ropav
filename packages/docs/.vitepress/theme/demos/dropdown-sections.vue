<script setup lang="ts">
import {
  Button,
  Dropdown,
  DropdownMenu,
  DropdownPopover,
  Label,
  MenuItem,
  MenuSection,
  Separator,
} from "ropav";
</script>

<template>
  <Dropdown>
    <Button variant="secondary">Actions</Button>

    <DropdownPopover>
      <DropdownMenu>
        <MenuSection>
          <MenuItem id="new" text-value="New file">
            <Label>New file</Label>
          </MenuItem>
          <MenuItem id="copy" text-value="Copy link">
            <Label>Copy link</Label>
          </MenuItem>
        </MenuSection>

        <Separator />

        <MenuSection>
          <MenuItem id="delete" text-value="Delete file" variant="danger">
            <Label>Delete file</Label>
          </MenuItem>
        </MenuSection>
      </DropdownMenu>
    </DropdownPopover>
  </Dropdown>
</template>
