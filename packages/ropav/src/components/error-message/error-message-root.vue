<script setup lang="ts" vapor>
import type { ErrorMessageRootProps } from "./error-message.types";

import { errorMessageVariants } from "@ropav/styles";
import { computed } from "vue";

import { useFieldIdsContext } from "../../composables/use-field-ids";

const props = defineProps<ErrorMessageRootProps>();

defineSlots<{ default?: () => unknown }>();

const styles = computed(() => errorMessageVariants({ class: props.class }));

// Inside a field that reports its validation state, the message takes the id the field
// points `aria-describedby` at, alongside any description.
const fieldIds = useFieldIdsContext();
const id = fieldIds?.claimErrorMessageId();
</script>

<template>
  <span :id="id" :class="styles" data-slot="error-message">
    <slot />
  </span>
</template>
