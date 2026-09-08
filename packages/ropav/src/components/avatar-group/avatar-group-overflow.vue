<script setup lang="ts" vapor>
import type { AvatarGroupOverflowProps } from "./avatar-group.types";

import { computed, useSlots } from "vue";

import { composeSlotClassName } from "../../utils/compose";
import { Avatar, AvatarFallback } from "../avatar";

import { useAvatarGroupContext } from "./avatar-group.context";

const props = defineProps<AvatarGroupOverflowProps>();

defineSlots<{ default?: () => unknown }>();

const callerSlots = useSlots();

/**
 * Whether the caller wrote a slot at all, read off its presence and never by running it. A
 * default written as `<slot>` fallback content drops the slots of anything nested inside it on
 * the first render from a VDOM host, so both paths are kept apart instead.
 */
const hasSlot = computed(() => Boolean(callerSlots["default"]));

const context = useAvatarGroupContext();

const overflowClass = computed(() =>
  composeSlotClassName(context?.slots.value.overflow, props.class),
);
</script>

<template>
  <Avatar :class="overflowClass" data-slot="avatar-group-overflow">
    <AvatarFallback>
      <slot v-if="hasSlot" />
      <template v-else-if="props.count !== undefined">+{{ props.count }}</template>
    </AvatarFallback>
  </Avatar>
</template>
