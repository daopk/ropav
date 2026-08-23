<script setup lang="ts" vapor>
import type { ToastRegionHostProps } from "./toast.types";

import { shallowRef } from "vue";

import { useToastQueue } from "@/components/toast/toast-queue";
import { useToastRegion } from "@/composables/use-toast-region";

const props = withDefaults(defineProps<ToastRegionHostProps>(), { ariaLabel: undefined });

const element = shallowRef<HTMLElement | null>(null);

const setElement = (next: unknown) => {
  element.value = (next as HTMLElement | null) ?? null;
};

const { visibleToasts } = useToastQueue(() => props.queue);

const api = useToastRegion({
  ariaLabel: () => props.ariaLabel,
  elementRef: element,
  onPauseAll: () => props.queue.pauseAll(),
  onResumeAll: () => props.queue.resumeAll(),
  visibleToasts,
});

props.onReady?.(api);
</script>

<template>
  <div
    :ref="setElement"
    data-testid="region"
    v-bind="api.regionAttrs.value"
    @focusin="api.onFocusin"
    @focusout="api.onFocusout"
    @pointerenter="api.onPointerenter"
    @pointerleave="api.onPointerleave"
  >
    <div
      v-for="entry in visibleToasts"
      :key="entry.key"
      :data-key="entry.key"
      role="alertdialog"
      tabindex="0"
    >
      {{ String(entry.content.title) }}
    </div>
  </div>
</template>
