<script setup lang="ts" vapor>
import type {DisclosureIndicatorProps} from "./disclosure.types";

import {dataAttr} from "../../utils/assertion";
import {composeSlotClassName} from "../../utils/compose";
import {IconChevronDown} from "../icons";

import {useDisclosureContext} from "./disclosure.context";

const props = defineProps<DisclosureIndicatorProps>();

defineSlots<{default?: () => unknown}>();

const {isExpanded, slots} = useDisclosureContext();
</script>

<template>
  <!--
    The class and `data-expanded` sit on this wrapper rather than on the icon itself.
    Reading a slot in Vapor renders it, so the icon cannot be inspected and cloned the
    way the React implementation does; a custom icon arrives as slot content instead.
  -->
  <span
    :class="composeSlotClassName(slots.indicator, props.class)"
    :data-expanded="dataAttr(isExpanded)"
    data-slot="disclosure-indicator"
  >
    <slot>
      <IconChevronDown />
    </slot>
  </span>
</template>
