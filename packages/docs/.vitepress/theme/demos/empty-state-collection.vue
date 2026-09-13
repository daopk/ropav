<script setup lang="ts">
import {
  EmptyState,
  Label,
  ListBox,
  ListBoxItem,
  SearchField,
  SearchFieldClearButton,
  SearchFieldGroup,
  SearchFieldInput,
  SearchFieldSearchIcon,
  Surface,
} from "ropav";
import { computed, shallowRef } from "vue";

const people = [
  { id: "ada", name: "Ada Lovelace" },
  { id: "grace", name: "Grace Hopper" },
  { id: "katherine", name: "Katherine Johnson" },
];

const query = shallowRef("");

const matched = computed(() =>
  people.filter((person) => person.name.toLowerCase().includes(query.value.toLowerCase())),
);
</script>

<template>
  <div class="stack">
    <SearchField v-model:value="query" aria-label="Search reviewers">
      <SearchFieldGroup>
        <SearchFieldSearchIcon />
        <SearchFieldInput placeholder="Search reviewers…" />
        <SearchFieldClearButton />
      </SearchFieldGroup>
    </SearchField>

    <Surface class="surface">
      <ListBox aria-label="Reviewers">
        <template #empty>
          <EmptyState>Nobody matches that search.</EmptyState>
        </template>

        <ListBoxItem v-for="person in matched" :id="person.id" :key="person.id">
          <Label>{{ person.name }}</Label>
        </ListBoxItem>
      </ListBox>
    </Surface>
  </div>
</template>

<style scoped>
.stack {
  display: flex;
  width: calc(var(--rp-spacing) * 64);
  flex-direction: column;
  gap: calc(var(--rp-spacing) * 3);
}

.surface {
  padding: 0;
}
</style>
