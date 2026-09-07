<script setup lang="ts">
import { Label, ListBox, ListBoxItem, ListBoxItemIndicator, ListBoxSection, Surface } from "ropav";

const people = [
  { id: "ada", name: "Ada Lovelace" },
  { id: "grace", name: "Grace Hopper" },
  { id: "katherine", name: "Katherine Johnson" },
] as const;
</script>

<template>
  <Surface class="surface">
    <ListBox aria-label="Reviewers" :default-selected-keys="['ada']" selection-mode="multiple">
      <ListBoxSection>
        <ListBoxItem v-for="person in people" :id="person.id" :key="person.id">
          <Label>{{ person.name }}</Label>
          <ListBoxItemIndicator />
        </ListBoxItem>
      </ListBoxSection>
    </ListBox>
  </Surface>
</template>

<style scoped>
.surface {
  width: calc(var(--spacing) * 56);
  padding: 0;
}
</style>
