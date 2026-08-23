<script setup lang="ts" vapor>
import type { AvatarFallbackProps } from "./avatar.types";

import { shallowRef, watchEffect } from "vue";

import { composeSlotClassName } from "../../utils/compose";

import { useAvatarContext } from "./avatar.context";

const props = defineProps<AvatarFallbackProps>();

defineSlots<{ default?: () => unknown }>();

const { imageStatus, slots } = useAvatarContext();

const canRender = shallowRef(props.delayMs === undefined);

/**
 * A delay only ever *reveals* the fallback — nothing here ever puts it back. So clearing
 * `delayMs` before the timer fires leaves the fallback hidden for good, which is exactly
 * what React does: its cleanup clears the timer and the next run has nothing to say.
 */
watchEffect((onCleanup) => {
  // Read inside the effect rather than destructuring at setup, so a later change re-arms.
  const delayMs = props.delayMs;

  if (delayMs === undefined) return;

  const timer = setTimeout(() => {
    canRender.value = true;
  }, delayMs);

  onCleanup(() => clearTimeout(timer));
});
</script>

<template>
  <span
    v-if="canRender && imageStatus !== 'loaded'"
    :class="composeSlotClassName(slots.fallback, props.class, { color: props.color })"
    data-slot="avatar-fallback"
  >
    <slot />
  </span>
</template>
