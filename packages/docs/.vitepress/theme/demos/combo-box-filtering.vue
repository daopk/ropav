<script setup lang="ts">
import {
  ComboBox,
  ComboBoxInputGroup,
  ComboBoxPopover,
  ComboBoxTrigger,
  Input,
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
  <ComboBox v-slot="{ items: matches }" class="field" :item-text-value="byName" :items="cities">
    <Label>Destination</Label>
    <ComboBoxInputGroup>
      <Input placeholder="Start typing…" />
      <ComboBoxTrigger />
    </ComboBoxInputGroup>

    <ComboBoxPopover>
      <ListBox>
        <ListBoxItem v-for="city in matches" :id="city.id" :key="city.id" :text-value="city.name">
          {{ city.name }}
          <ListBoxItemIndicator />
        </ListBoxItem>
      </ListBox>
    </ComboBoxPopover>
  </ComboBox>
</template>

<style scoped>
.field {
  width: calc(var(--rp-spacing) * 64);
}
</style>
