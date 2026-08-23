<script setup lang="ts" vapor>
import type { FieldErrorContentProps } from "./field-error.types";

import { fieldErrorVariants } from "@ropav/styles";
import { computed } from "vue";

import { useFieldIdsContext } from "../../composables/use-field-ids";

const props = defineProps<FieldErrorContentProps>();

defineSlots<{ default?: () => unknown }>();

const styles = computed(() => fieldErrorVariants({ class: props.class }));

// Split out from the root so the id is claimed only while a message is actually on screen.
// A claim lasts as long as the scope that made it, so a single component holding the claim
// across a `v-if` would leave the field pointing `aria-describedby` at nothing.
const fieldIds = useFieldIdsContext();
const id = fieldIds?.claimErrorMessageId();
</script>

<template>
  <!--
    `data-visible` is unconditional, matching React. The stylesheet collapses `.field-error`
    to zero height and no opacity without it, and this element only exists while the field is
    invalid, so there is no state in which it should stay collapsed.
  -->
  <span :id="id" :class="styles" data-slot="field-error" data-visible="true">
    <slot />
  </span>
</template>
