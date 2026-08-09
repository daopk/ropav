<script setup lang="ts" vapor>
import type {DrawerContentProps} from "./drawer.types";

import {drawerVariants} from "@heroui/styles";
import {computed, shallowRef} from "vue";

import {dataAttr} from "../../utils/assertion";
import {OverlayDismissButton} from "../overlay";

import {provideDrawerContext, useDrawerContext, useDrawerOverlayContext} from "./drawer.context";

const props = withDefaults(defineProps<DrawerContentProps>(), {placement: "bottom"});

defineSlots<{default?: () => unknown}>();

const context = useDrawerContext();
const overlay = useDrawerOverlayContext();

const element = shallowRef<HTMLElement | null>(null);

const slots = computed(() => ({
  ...context.slots.value,
  ...drawerVariants({placement: props.placement}),
}));

provideDrawerContext({
  ...context,
  placement: computed(() => props.placement),
  slots,
});

const styles = computed(() => slots.value.content({class: props.class}));

/**
 * Reported upward rather than measured from above.
 *
 * This element is what the backdrop's machinery acts on — the dismiss boundary, the subtree left
 * visible to assistive technology, the focus scope — and the backdrop cannot reach into its own slot
 * content to find it. It is also where `data-entering` and `data-exiting` land, which the stylesheet
 * reads through a descendant selector to slide the panel inside it.
 */
const setElement = (next: unknown) => {
  element.value = (next as HTMLElement | null) ?? null;
  overlay?.registerContentElement(element.value);
};

const onKeydown = (event: KeyboardEvent) => overlay?.onKeydown(event);
</script>

<template>
  <div
    :ref="setElement"
    :class="styles"
    :data-entering="dataAttr(overlay?.isContentEntering.value)"
    :data-exiting="dataAttr(overlay?.isExiting.value)"
    :data-placement="props.placement"
    data-slot="drawer-content"
    @keydown="onKeydown"
  >
    <OverlayDismissButton v-if="overlay?.isDismissable.value" :close="overlay.close" />
    <slot />
  </div>
</template>
