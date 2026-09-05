<script setup lang="ts">
import {
  Button,
  Disclosure,
  DisclosureBody,
  DisclosureContent,
  DisclosureGroup,
  DisclosureHeading,
  DisclosureIndicator,
} from "ropav";

const sections = [
  {
    body: "Every component ships its own stylesheet, and the theme decides the colours.",
    id: "styling",
    label: "Styling",
  },
  {
    body: "One tab stop per control, and the keyboard interactions the ARIA pattern asks for.",
    id: "keyboard",
    label: "Keyboard",
  },
];
</script>

<template>
  <DisclosureGroup class="w-full max-w-md" :default-expanded-keys="['styling']">
    <Disclosure v-for="section in sections" :id="section.id" :key="section.id">
      <DisclosureHeading>
        <Button class="w-full justify-between" variant="tertiary">
          {{ section.label }}
          <DisclosureIndicator class="text-muted" />
        </Button>
      </DisclosureHeading>
      <DisclosureContent>
        <DisclosureBody class="p-3 text-sm text-muted">{{ section.body }}</DisclosureBody>
      </DisclosureContent>
    </Disclosure>
  </DisclosureGroup>
</template>
