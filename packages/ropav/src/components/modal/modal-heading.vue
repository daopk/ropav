<script setup lang="ts" vapor>
import type { ModalHeadingProps } from "./modal.types";

import { computed } from "vue";

import { useFieldIdsContext } from "../../composables/use-field-ids";

import { useModalContext } from "./modal.context";

const props = defineProps<ModalHeadingProps>();

defineSlots<{ default?: () => unknown }>();

const { slots } = useModalContext();

// The heading takes the id the dialog points `aria-labelledby` at, which is how a modal is named
// by what it says rather than by the button that opened it.
const fieldIds = useFieldIdsContext();
const id = fieldIds?.claimHeadingId();

/**
 * Two by default.
 *
 * A dialog is a document of its own as far as assistive technology is concerned, so its heading
 * starts one level below the page title rather than continuing the page's outline.
 */
const tag = computed(() => `h${props.level ?? 2}`);

const styles = computed(() => slots.value.heading({ class: props.class }));
</script>

<template>
  <component :is="tag" :id="id" :class="styles" data-slot="modal-heading">
    <slot />
  </component>
</template>
