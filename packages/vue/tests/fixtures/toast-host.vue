<script setup lang="ts" vapor>
import type {ToastHostProps} from "./toast.types";

import {onMounted, onScopeDispose} from "vue";

import {useToast} from "@/composables/use-toast";

const props = withDefaults(defineProps<ToastHostProps>(), {showDescription: undefined});

const api = useToast({
  onClose: () => props.toast.onClose?.(),
  timeout: () => props.toast.timeout,
  timer: () => props.toast.timer,
});

// Claimed from the host rather than a child part, so the suite exercises the claim itself without
// a component tree in the way.
onMounted(() => {
  if (props.showDescription !== true) return;

  const release = api.registerDescription();

  onScopeDispose(release);
});

props.onReady?.(api);
</script>

<template>
  <div data-testid="toast" v-bind="api.toastAttrs.value">
    <div data-testid="content" v-bind="api.contentAttrs.value">
      <span data-testid="title" v-bind="api.titleAttrs.value">Title</span>
      <span
        v-if="props.showDescription === true"
        data-testid="description"
        v-bind="api.descriptionAttrs.value"
        >Description</span
      >
    </div>
  </div>
</template>
