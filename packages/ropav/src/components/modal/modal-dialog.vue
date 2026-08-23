<script setup lang="ts" vapor>
import type { ModalDialogProps } from "./modal.types";

import { computed, shallowRef, watch } from "vue";

import { provideFieldIdsContext, useFieldIds } from "../../composables/use-field-ids";
import { provideSurfaceContext } from "../surface";

import { useModalContext } from "./modal.context";

const props = defineProps<ModalDialogProps>();

defineSlots<{ default?: (props: { close: () => void }) => unknown }>();

const { dialogId, labelledBy, placement, slots, state } = useModalContext();

const element = shallowRef<HTMLElement | null>(null);

// The dialog is a surface in its own right, so anything inside it that picks its colours from the
// surface it sits on — a field, a chip — reads the dialog rather than the page behind it.
provideSurfaceContext({ variant: computed(() => "default" as const) });

// Only the heading is referenced, so nothing else hands out an id it would never be pointed at.
const { context, headingId } = useFieldIds({ slots: ["heading"] });

provideFieldIdsContext(context);

/**
 * The heading names the dialog, and the trigger names it when there is no heading.
 *
 * A dialog with no accessible name at all is the one outcome worth avoiding, which is why the
 * fallback exists rather than the reference simply being dropped.
 */
const labelledByResolved = computed(() => headingId.value ?? labelledBy.value);

const styles = computed(() => slots.value.dialog({ class: props.class }));

const setElement = (next: unknown) => {
  element.value = (next as HTMLElement | null) ?? null;
};

/**
 * Focus the dialog itself once it appears, unless something inside already has focus.
 *
 * Without this a keyboard user is left on the trigger with the dialog open in front of them, and a
 * screen reader never enters it.
 */
watch(
  element,
  (dialog) => {
    if (!dialog) return;
    if (dialog.contains(document.activeElement)) return;

    dialog.focus({ preventScroll: true });
  },
  { flush: "post", immediate: true },
);
</script>

<template>
  <section
    :id="dialogId"
    :ref="setElement"
    :aria-labelledby="labelledByResolved"
    :class="styles"
    :data-placement="placement"
    data-slot="modal-dialog"
    role="dialog"
    tabindex="-1"
  >
    <slot :close="state.close" />
  </section>
</template>
