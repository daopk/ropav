<script setup lang="ts">
import {
  Autocomplete,
  AutocompleteIndicator,
  AutocompletePopover,
  AutocompleteTrigger,
  AutocompleteValue,
  Label,
  ListBox,
  ListBoxItem,
  ListBoxItemIndicator,
} from "ropav";

const cities = [
  { id: "lisbon", name: "Lisbon" },
  { id: "osaka", name: "Osaka" },
  { id: "quito", name: "Quito" },
  { id: "tallinn", name: "Tallinn" },
];

const byName = (city: { name: string }) => city.name;
</script>

<template>
  <Autocomplete
    class="w-64"
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
      <ListBox>
        <ListBoxItem v-for="city in cities" :id="city.id" :key="city.id" :text-value="city.name">
          {{ city.name }}
          <ListBoxItemIndicator />
        </ListBoxItem>
      </ListBox>
    </AutocompletePopover>
  </Autocomplete>
</template>
