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
  <DisclosureGroup class="panel" :default-expanded-keys="['styling']">
    <Disclosure v-for="section in sections" :id="section.id" :key="section.id">
      <DisclosureHeading>
        <Button class="trigger" variant="tertiary">
          {{ section.label }}
          <DisclosureIndicator class="indicator" />
        </Button>
      </DisclosureHeading>
      <DisclosureContent>
        <DisclosureBody class="body">{{ section.body }}</DisclosureBody>
      </DisclosureContent>
    </Disclosure>
  </DisclosureGroup>
</template>

<style scoped>
.panel {
  width: 100%;
  max-width: var(--container-md);
}

.trigger {
  width: 100%;
  justify-content: space-between;
}

.indicator {
  color: var(--muted);
}

/* `DisclosureBody` puts the class on the element inside its root, which a scoped rule cannot
   reach on its own - the panel is the nearest thing wearing the scope. */
.panel :deep(.body) {
  color: var(--muted);
  padding: calc(var(--spacing) * 3);
  font-size: var(--text-sm);
  line-height: var(--text-sm--line-height);
}
</style>
