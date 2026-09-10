<script setup lang="ts">
import {
  Autocomplete,
  AutocompleteFilter,
  AutocompleteIndicator,
  AutocompletePopover,
  AutocompleteTrigger,
  AutocompleteValue,
  Label,
  ListBox,
  ListBoxItem,
  ListBoxItemIndicator,
  SearchField,
  SearchFieldClearButton,
  SearchFieldGroup,
  SearchFieldInput,
  SearchFieldSearchIcon,
  useFilter,
} from "ropav";

const cities = [
  { id: "lisbon", name: "Lisbon" },
  { id: "osaka", name: "Osaka" },
  { id: "quito", name: "Quito" },
  { id: "tallinn", name: "Tallinn" },
];

const byName = (city: { name: string }) => city.name;

const filter = useFilter({ sensitivity: "base" });
</script>

<template>
  <Autocomplete
    class="field"
    :item-text-value="byName"
    :items="cities"
    placeholder="Pick a city"
    selection-mode="single"
  >
    <Label>Destination</Label>
    <AutocompleteTrigger>
      <AutocompleteValue />
      <AutocompleteIndicator />
    </AutocompleteTrigger>

    <AutocompletePopover>
      <AutocompleteFilter v-slot="{ items: matches }" :filter="filter.contains">
        <SearchField auto-focus aria-label="Search cities" name="search" variant="secondary">
          <SearchFieldGroup>
            <SearchFieldSearchIcon />
            <SearchFieldInput placeholder="Search…" />
            <SearchFieldClearButton />
          </SearchFieldGroup>
        </SearchField>

        <ListBox>
          <ListBoxItem v-for="city in matches" :id="city.id" :key="city.id" :text-value="city.name">
            {{ city.name }}
            <ListBoxItemIndicator />
          </ListBoxItem>
        </ListBox>
      </AutocompleteFilter>
    </AutocompletePopover>
  </Autocomplete>
</template>

<style scoped>
.field {
  width: calc(var(--rp-spacing) * 64);
}
</style>
