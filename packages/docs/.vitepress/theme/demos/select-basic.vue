<script setup lang="ts">
import {
  Label,
  ListBox,
  ListBoxItem,
  ListBoxItemIndicator,
  Select,
  SelectIndicator,
  SelectPopover,
  SelectTrigger,
  SelectValue,
} from "ropav";

const items = [
  { id: "lisbon", name: "Lisbon" },
  { id: "osaka", name: "Osaka" },
  { id: "quito", name: "Quito" },
  { id: "tallinn", name: "Tallinn" },
];

const byName = (item: { name: string }) => item.name;
</script>

<template>
  <Select class="field" :item-text-value="byName" :items="items" placeholder="Pick a city">
    <Label>Destination</Label>
    <SelectTrigger>
      <SelectValue />
      <SelectIndicator />
    </SelectTrigger>
    <SelectPopover>
      <ListBox>
        <ListBoxItem v-for="item in items" :id="item.id" :key="item.id" :text-value="item.name">
          {{ item.name }}
          <ListBoxItemIndicator />
        </ListBoxItem>
      </ListBox>
    </SelectPopover>
  </Select>
</template>

<style scoped>
.field {
  width: calc(var(--rp-spacing) * 64);
}
</style>
