<script setup lang="ts" vapor>
import type {ToolbarRootProps} from "./toolbar.types";

import {toolbarVariants} from "@heroui/styles";
import {computed, shallowRef} from "vue";

import {useToolbar} from "../../composables/use-toolbar";
import {provideSeparatorContext} from "../separator/separator.context";

import {provideToolbarContext} from "./toolbar.context";

const props = withDefaults(defineProps<ToolbarRootProps>(), {orientation: "horizontal"});

defineSlots<{default?: () => unknown}>();

const element = shallowRef<HTMLElement | null>(null);

const styles = computed(() =>
  toolbarVariants({
    class: props.class,
    isAttached: props.isAttached,
    orientation: props.orientation,
  }),
);

const orientation = computed(() => props.orientation);
const toolbar = useToolbar({element, orientation});

provideToolbarContext({orientation});

// A rule inside a toolbar divides along the *cross* axis: a row of controls is broken up by
// vertical rules. The caller should not have to say so, and the toolbar stylesheet sizes the
// rule on exactly that assumption.
provideSeparatorContext({
  orientation: computed(() => (props.orientation === "horizontal" ? "vertical" : "horizontal")),
});
</script>

<template>
  <div
    ref="element"
    :aria-orientation="props.orientation"
    :class="styles"
    :data-orientation="props.orientation"
    data-slot="toolbar"
    :role="toolbar.role.value"
    @focusin="toolbar.onFocusin"
    @focusout="toolbar.onFocusout"
    @keydown.capture="toolbar.onKeydown"
  >
    <slot />
  </div>
</template>
