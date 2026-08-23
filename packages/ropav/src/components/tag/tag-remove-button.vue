<script setup lang="ts" vapor>
import type { TagRemoveButtonProps } from "./tag.types";

import { CloseButtonRoot } from "../close-button";

import { useTagContext } from "./tag.context";

const props = defineProps<TagRemoveButtonProps>();

defineSlots<{ default?: () => unknown }>();

const { remove, slots } = useTagContext();

/*
 * A plain `slot` DOM attribute, not Vue 2's slot syntax — React Aria emits it on the remove
 * button, and the two builds' markup has to match.
 *
 * Passed through `v-bind` because a literal or bound `slot` in the template reads as the old
 * syntax to the linter, and silencing that would need a template comment, which Vue keeps in the
 * rendered DOM.
 */
const domAttributes = { slot: "remove" };
</script>

<template>
  <CloseButtonRoot
    v-bind="domAttributes"
    aria-label="Remove tag"
    :class="slots.removeButton({ class: props.class })"
    data-slot="tag-remove-button"
    @click="remove"
  >
    <slot />
  </CloseButtonRoot>
</template>
