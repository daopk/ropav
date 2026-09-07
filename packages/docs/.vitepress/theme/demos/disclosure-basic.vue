<script setup lang="ts">
import {
  Button,
  Disclosure,
  DisclosureBody,
  DisclosureContent,
  DisclosureHeading,
  DisclosureIndicator,
} from "ropav";
</script>

<template>
  <Disclosure class="panel" default-expanded>
    <DisclosureHeading>
      <Button class="trigger" variant="tertiary">
        What is in the box?
        <DisclosureIndicator class="indicator" />
      </Button>
    </DisclosureHeading>
    <DisclosureContent>
      <DisclosureBody class="body">
        Every component, its stylesheet, and the types that go with them.
      </DisclosureBody>
    </DisclosureContent>
  </Disclosure>
</template>

<style scoped>
.panel {
  width: 100%;
  max-width: var(--rp-container-md);
}

.trigger {
  width: 100%;
  justify-content: space-between;
}

.indicator {
  color: var(--rp-muted);
}

/* `DisclosureBody` puts the class on the element inside its root, which a scoped rule cannot
   reach on its own - the panel is the nearest thing wearing the scope. */
.panel :deep(.body) {
  color: var(--rp-muted);
  padding: calc(var(--rp-spacing) * 3);
  font-size: var(--rp-text-sm);
  line-height: var(--rp-text-sm--line-height);
}
</style>
