<script setup lang="ts" vapor>
import type { QueuedToast } from "./toast.types";

import { computed, shallowRef, watch } from "vue";

import { useMediaQuery } from "../../composables/use-media-query";
import SpinnerRoot from "../spinner/spinner-root.vue";

import ToastActionButton from "./toast-action-button.vue";
import ToastCloseButton from "./toast-close-button.vue";
import ToastContent from "./toast-content.vue";
import ToastDescription from "./toast-description.vue";
import ToastIndicator from "./toast-indicator.vue";
import ToastRenderable from "./toast-renderable.vue";
import ToastRoot from "./toast-root.vue";
import ToastTitle from "./toast-title.vue";

const props = defineProps<{ toast: QueuedToast }>();

const content = computed(() => props.toast.content ?? {});

/**
 * Below this the action button moves *inside* the content column instead of sitting beside it,
 * because there is no room for a row.
 */
const isMobile = useMediaQuery("(max-width: 768px)");

/**
 * Which of the three indicators is showing. Tracked here rather than inside the indicator because
 * the three are separate branches: settling a promise toast unmounts the spinner's instance and
 * mounts a fresh one, which would have no memory of what it replaced.
 */
const indicatorKind = computed(() => {
  if (content.value.isLoading === true) return "loading";

  return content.value.indicator === undefined ? "default" : "custom";
});

const hasSwappedIndicator = shallowRef(false);

// No `immediate`, so the indicator a toast arrives with is never treated as a replacement.
watch(indicatorKind, () => {
  hasSwappedIndicator.value = true;
});

const action = computed(() => {
  const value = content.value.actionProps;

  return value?.label == null ? undefined : value;
});

/** Handlers cannot travel through `v-bind`, so the press is bound separately from the props. */
const actionProps = computed(() => {
  if (!action.value) return undefined;

  const { label: _label, onPress: _onPress, ...rest } = action.value;

  return rest;
});
</script>

<template>
  <ToastRoot :toast="props.toast" :variant="content.variant">
    <template v-if="content.indicator !== null">
      <ToastIndicator
        v-if="content.isLoading === true"
        :is-swapped="hasSwappedIndicator"
        :variant="content.variant"
      >
        <SpinnerRoot color="current" size="sm" />
      </ToastIndicator>
      <ToastIndicator
        v-else-if="content.indicator !== undefined"
        :is-swapped="hasSwappedIndicator"
        :variant="content.variant"
      >
        <ToastRenderable :value="content.indicator" />
      </ToastIndicator>
      <ToastIndicator v-else :is-swapped="hasSwappedIndicator" :variant="content.variant" />
    </template>
    <ToastContent>
      <ToastTitle v-if="Boolean(content.title)">
        <ToastRenderable :value="content.title" />
      </ToastTitle>
      <ToastDescription v-if="Boolean(content.description)">
        <ToastRenderable :value="content.description" />
      </ToastDescription>
      <ToastActionButton v-if="isMobile && action" v-bind="actionProps" @click="action.onPress?.()">
        <ToastRenderable :value="action.label" />
      </ToastActionButton>
    </ToastContent>
    <ToastActionButton v-if="!isMobile && action" v-bind="actionProps" @click="action.onPress?.()">
      <ToastRenderable :value="action.label" />
    </ToastActionButton>
    <ToastCloseButton />
  </ToastRoot>
</template>
