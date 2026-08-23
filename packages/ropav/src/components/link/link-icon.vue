<script setup lang="ts" vapor>
import type {LinkIconProps} from "./link.types";

import {computed, useSlots} from "vue";

import {dataAttr} from "../../utils/assertion";
import {ExternalLinkIcon} from "../icons";

import {useLinkContext} from "./link.context";

const props = defineProps<LinkIconProps>();

defineSlots<{default?: () => unknown}>();

const {slots} = useLinkContext();

const styles = computed(() => slots.value.icon({class: props.class}));

const callerSlots = useSlots();

/**
 * Whether the built-in icon is the one being shown, which the stylesheet keys the extra spacing
 * on — a glyph of its own needs no room made for it.
 *
 * Read off whether a slot was handed over at all, never by running it: presence is knowable in
 * vapor, contents are not.
 */
const isDefaultIcon = computed(() => !callerSlots["default"]);
</script>

<template>
  <span :class="styles" :data-default-icon="dataAttr(isDefaultIcon)" data-slot="link-icon">
    <slot>
      <ExternalLinkIcon data-slot="link-default-icon" />
    </slot>
  </span>
</template>
