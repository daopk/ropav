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
      <SearchFieldInput class="w-72" placeholder="Search…" />
      <SearchFieldClearButton />
    </SearchFieldGroup>
  </SearchField>
</template>
