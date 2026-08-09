<script setup lang="ts" vapor>
import type {ModalContainerProps} from "./modal.types";

import {modalVariants} from "@heroui/styles";
import {computed, shallowRef} from "vue";

import {dataAttr} from "../../utils/assertion";
import {OverlayDismissButton} from "../overlay";

import {provideModalContext, useModalContext, useModalOverlayContext} from "./modal.context";

const props = withDefaults(defineProps<ModalContainerProps>(), {placement: "auto"});

defineSlots<{default?: () => unknown}>();

const context = useModalContext();
const overlay = useModalOverlayContext();

const element = shallowRef<HTMLElement | null>(null);

const slots = computed(() => ({
  ...context.slots.value,
  // Deliberately without `variant`, matching React: this overwrites the backdrop slot with a
  // default-variant one, which nothing below reads.
  ...modalVariants({scroll: props.scroll, size: props.size}),
}));

provideModalContext({
  ...context,
  placement: computed(() => props.placement),
  slots,
});

const styles = computed(() => slots.value.container({class: props.class}));

/**
 * Reported upward rather than measured from above.
 *
 * This element is what the backdrop's machinery acts on — the dismiss boundary, the subtree left
 * visible to assistive technology, the focus scope — and the backdrop cannot reach into its own
 * slot content to find it.
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
    data-slot="modal-container"
    @keydown="onKeydown"
  >
    <OverlayDismissButton v-if="overlay?.isDismissable.value" :close="overlay.close" />
    <slot />
  </div>
</template>
