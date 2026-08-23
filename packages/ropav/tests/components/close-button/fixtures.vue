<script setup lang="ts" vapor>
import type { CloseButtonResponderFixtureProps } from "./fixtures.types";

import { computed } from "vue";

import { CloseButton } from "@/components/close-button";
import { providePressResponder } from "@/composables/press-responder";

/**
 * Stands in for whatever drives the button from above — a search field owning its clear
 * button, a dropdown making its first child the trigger. A component of its own because
 * `inject` never sees a `provide` from the same component.
 */
const props = withDefaults(defineProps<CloseButtonResponderFixtureProps>(), {
  isPressed: undefined,
});

const noop = () => {};

providePressResponder({
  attrs: computed(() => props.attrs ?? {}),
  handlers: computed(() => ({
    onClick: (event) => props.onResponderClick?.(event),
    onDragstart: noop,
    onKeydown: (event) => props.onResponderKeydown?.(event),
    onMousedown: noop,
    onPointerdown: (event) => props.onResponderPointerdown?.(event),
    onPointerenter: noop,
    onPointerleave: noop,
    onPointerup: noop,
  })),
  isPressed: computed(() => props.isPressed ?? false),
  registerElement: (element) => props.onRegister?.(element),
});
</script>

<template>
  <CloseButton v-if="props.withOwnClick" @click="props.onOwnClick" />
  <CloseButton v-else />
</template>
