<script setup lang="ts">
import {
  Label,
  SearchField,
  SearchFieldClearButton,
  SearchFieldGroup,
  SearchFieldInput,
  SearchFieldSearchIcon,
} from "ropav";
</script>

<template>
  <SearchField default-value="oklch" name="search">
    <Label>Search the docs</Label>
    <SearchFieldGroup>
      <SearchFieldSearchIcon />
      <SearchFieldInput class="field" placeholder="Search…" />
      <SearchFieldClearButton />
    </SearchFieldGroup>
  </SearchField>
</template>

<style scoped>
.field {
  width: calc(var(--spacing) * 72);
}
</style>
