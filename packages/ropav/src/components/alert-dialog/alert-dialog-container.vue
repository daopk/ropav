<script setup lang="ts" vapor>
import type {AlertDialogContainerProps} from "./alert-dialog.types";

import {alertDialogVariants} from "@heroui/styles";
import {computed, shallowRef} from "vue";

import {dataAttr} from "../../utils/assertion";
import {OverlayDismissButton} from "../overlay";

import {
  provideAlertDialogContext,
  useAlertDialogContext,
  useAlertDialogOverlayContext,
} from "./alert-dialog.context";

const props = withDefaults(defineProps<AlertDialogContainerProps>(), {placement: "auto"});

defineSlots<{default?: () => unknown}>();

const context = useAlertDialogContext();
const overlay = useAlertDialogOverlayContext();

const element = shallowRef<HTMLElement | null>(null);

const slots = computed(() => ({
  ...context.slots.value,
  // Deliberately without `variant`: this overwrites the backdrop slot with a default-variant one,
  // which nothing below reads.
  ...alertDialogVariants({size: props.size}),
}));

provideAlertDialogContext({
  ...context,
  placement: computed(() => props.placement),
  slots,
});

const styles = computed(() => slots.value.container({class: props.class}));

/**
 * Reported upward rather than measured from above.
 *
 * This element is what the backdrop's machinery acts on — the dismiss boundary, the subtree left
 * visible to assistive technology, the focus scope — and the backdrop cannot reach into its own slot
 * content to find it.
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
    data-slot="alert-dialog-container"
    @keydown="onKeydown"
  >
    <OverlayDismissButton v-if="overlay?.isDismissable.value" :close="overlay.close" />
    <slot />
  </div>
</template>
