<script setup lang="ts" vapor>
import type { DescriptionRootProps } from "./description.types";

import { descriptionVariants } from "@ropav/styles";
import { computed } from "vue";

import { useFieldIdsContext } from "../../composables/use-field-ids";

const props = defineProps<DescriptionRootProps>();

defineSlots<{ default?: () => unknown }>();

const styles = computed(() => descriptionVariants({ class: props.class }));

// Inside a container that describes itself by its help text — a collection item, a field
// root — the description takes the id the container points `aria-describedby` at.
const fieldIds = useFieldIdsContext();
const id = fieldIds?.claimDescriptionId();
</script>

<template>
  <span :id="id" :class="styles" data-slot="description">
    <slot />
  </span>
</template>
