<script setup lang="ts" vapor>
import type {ListBoxSectionRootProps} from "./list-box-section.types";

import {listboxSectionVariants} from "@heroui/styles";
import {computed} from "vue";

import {provideFieldIdsContext, useFieldIds} from "../../composables/use-field-ids";

const props = defineProps<ListBoxSectionRootProps>();

defineSlots<{default?: () => unknown}>();

const styles = computed(() => listboxSectionVariants({class: props.class}));

// ARIA does not allow a heading inside a listbox, so the section's `Header` is demoted to
// presentation and reused only as the visual label this group points at. The section itself
// contributes nothing to the collection: items register directly, and document order already
// puts them in the right sequence, nesting or not.
const fieldIds = useFieldIds({headingRole: "presentation", slots: ["heading"]});

provideFieldIdsContext(fieldIds.context);
</script>

<template>
  <section
    :aria-label="props.ariaLabel"
    :aria-labelledby="fieldIds.headingId.value"
    :class="styles"
    role="group"
  >
    <slot />
  </section>
</template>
