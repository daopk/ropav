<script setup lang="ts">
import type { ControlSpec } from "../../../playgrounds/types";

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
import { computed } from "vue";

/** Stands for "write nothing", which a prop with no default of its own still needs. */
const UNSET = "__unset__";

const props = defineProps<{ control: ControlSpec }>();

const model = defineModel<string | undefined>({ required: true });

const items = computed(() => [
  ...(props.control.defaultValue === undefined ? [{ id: UNSET, name: "unset" }] : []),
  ...(props.control.options ?? []).map((option) => ({ id: option, name: option })),
]);

const value = computed<string | number | null>({
  get: () => model.value ?? UNSET,
  set: (next) => {
    model.value = next === UNSET || next === null ? undefined : String(next);
  },
});

const byName = (item: { name: string }) => item.name;
</script>

<template>
  <Select v-model:value="value" full-width :item-text-value="byName" :items="items" size="sm">
    <Label>{{ control.name }}</Label>
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
