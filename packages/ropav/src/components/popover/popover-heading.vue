<script setup lang="ts" vapor>
import type { PopoverHeadingProps } from "./popover.types";

import { computed } from "vue";

import { useFieldIdsContext } from "../../composables/use-field-ids";

import { usePopoverContext } from "./popover.context";

const props = defineProps<PopoverHeadingProps>();

defineSlots<{ default?: () => unknown }>();

const { slots } = usePopoverContext();

// Inside a dialog the heading takes the id the dialog points `aria-labelledby` at.
const fieldIds = useFieldIdsContext();
const id = fieldIds?.claimHeadingId();

/**
 * Two inside a dialog, three on its own.
 *
 * A dialog is a document of its own as far as assistive technology is concerned, so its heading
 * starts one level below the page title; a heading floating in the page cannot assume that.
 */
const tag = computed(() => `h${props.level ?? (fieldIds ? 2 : 3)}`);

const styles = computed(() => slots.value.heading({ class: props.class }));
</script>

<template>
  <component :is="tag" :id="id" :class="styles">
    <slot />
  </component>
</template>
