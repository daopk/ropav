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
  <Disclosure class="w-full max-w-md" default-expanded>
    <DisclosureHeading>
      <Button class="w-full justify-between" variant="tertiary">
        What is in the box?
        <DisclosureIndicator class="text-muted" />
      </Button>
    </DisclosureHeading>
    <DisclosureContent>
      <DisclosureBody class="p-3 text-sm text-muted">
        Every component, its stylesheet, and the types that go with them.
      </DisclosureBody>
    </DisclosureContent>
  </Disclosure>
</template>
