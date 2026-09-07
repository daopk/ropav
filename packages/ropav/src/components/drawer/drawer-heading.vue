<script setup lang="ts" vapor>
import type { DrawerHeadingProps } from "./drawer.types";

import { computed } from "vue";

import { useFieldIdsContext } from "../../composables/use-field-ids";

const props = defineProps<DrawerHeadingProps>();

defineSlots<{ default?: () => unknown }>();

// The heading takes the id the dialog points `aria-labelledby` at, which is how a drawer is named by
// what it says rather than by the button that opened it.
const fieldIds = useFieldIdsContext();
const id = fieldIds?.claimHeadingId();

/**
 * Two by default.
 *
 * A dialog is a document of its own as far as assistive technology is concerned, so its heading
 * starts one level below the page title rather than continuing the page's outline.
 */
const tag = computed(() => `h${props.level ?? 2}`);
</script>

<template>
  <component
    :is="tag"
    :id="id"
    :class="['rp-drawer__heading', props.class]"
    data-slot="drawer-heading"
  >
    <slot />
  </component>
</template>
