<script setup lang="ts" vapor>
import type { FieldsetFixtureProps } from "./fixtures.types";

import { Description } from "@/components/description";
import { FieldGroup, FieldsetActions, FieldsetLegend, FieldsetRoot } from "@/components/fieldset";

const props = withDefaults(defineProps<FieldsetFixtureProps>(), {
  withActions: true,
  withGroup: true,
  withLegend: true,
});
</script>

<template>
  <FieldsetRoot :class="props.class" :disabled="props.disabled">
    <FieldsetLegend v-if="props.withLegend" :class="props.legendClass">Profile</FieldsetLegend>
    <Description>Update your profile information.</Description>
    <FieldGroup v-if="props.withGroup" :class="props.groupClass">
      <span data-testid="field">a field</span>
    </FieldGroup>
    <FieldsetActions v-if="props.withActions" :class="props.actionsClass">
      <span data-testid="action">an action</span>
    </FieldsetActions>
  </FieldsetRoot>
</template>
