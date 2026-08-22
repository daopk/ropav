<script setup lang="ts" vapor>
import type {ToastDescriptionProps} from "./toast.types";

import {onMounted, onScopeDispose} from "vue";

import {composeSlotClassName} from "../../utils/compose";

import {useToastItemContext, useToastRegionContext} from "./toast.context";

const props = defineProps<ToastDescriptionProps>();

defineSlots<{default?: () => unknown}>();

const {slots} = useToastRegionContext();
const {descriptionAttrs, registerDescription} = useToastItemContext();

// Claimed rather than probed off the document: the toast points `aria-describedby` at this id only
// while something is actually carrying it, so a toast without a description leaves no orphan.
onMounted(() => {
  const release = registerDescription();

  onScopeDispose(release);
});
</script>

<template>
  <span
    :class="composeSlotClassName(slots.description, props.class)"
    data-slot="toast-description"
    v-bind="{...descriptionAttrs, slot: 'description'}"
  >
    <slot />
  </span>
</template>
