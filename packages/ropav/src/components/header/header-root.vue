<script setup lang="ts" vapor>
import type { HeaderRootProps } from "./header.types";

import { headerVariants } from "@ropav/styles";
import { computed } from "vue";

import { useFieldIdsContext } from "../../composables/use-field-ids";

const props = defineProps<HeaderRootProps>();

defineSlots<{ default?: () => unknown }>();

const styles = computed(() => headerVariants({ class: props.class }));

// Inside a container that labels itself by its heading — a listbox or menu section — the
// header takes the id the container points `aria-labelledby` at, and whatever role the
// container needs it to carry.
const fieldIds = useFieldIdsContext();
const id = fieldIds?.claimHeadingId();
</script>

<template>
  <header :id="id" :class="styles" data-slot="header" :role="fieldIds?.headingRole">
    <slot />
  </header>
</template>
