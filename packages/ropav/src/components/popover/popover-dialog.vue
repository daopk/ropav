<script setup lang="ts" vapor>
import type { PopoverDialogProps } from "./popover.types";

import { computed, onScopeDispose, shallowRef, watch } from "vue";

import { provideFieldIdsContext, useFieldIds } from "../../composables/use-field-ids";
import { useOverlayScopeContext, useOverlayTargetContext } from "../overlay";

import { usePopoverContext } from "./popover.context";

const props = defineProps<PopoverDialogProps>();

defineSlots<{ default?: (props: { close: () => void }) => unknown }>();

const { slots } = usePopoverContext();
const target = useOverlayTargetContext();
const scope = useOverlayScopeContext();

const element = shallowRef<HTMLElement | null>(null);

/**
 * This is the dialog, so the popover around it stops being one.
 *
 * Registered rather than detected, because the popover would otherwise have to wait for the DOM
 * to settle before it knew — and for one flush there would be two elements claiming the role.
 */
if (scope) {
  const releaseDialog = scope.registerDialog();
  // The popover only holds focus for a dialog, and it is no longer the dialog.
  const releaseContain = scope.requestFocusContain();

  onScopeDispose(() => {
    releaseDialog();
    releaseContain();
  }, true);
}

// Only the heading is referenced, so nothing else hands out an id it would never be pointed at.
const { context, headingId } = useFieldIds({ slots: ["heading"] });

provideFieldIdsContext(context);

/**
 * The heading names the dialog, and the trigger names it when there is no heading.
 *
 * A dialog with no accessible name at all is the one outcome worth avoiding, which is why the
 * fallback exists rather than the reference simply being dropped.
 */
const labelledBy = computed(() => headingId.value ?? target.labelledBy.value);

const styles = computed(() => slots.value.dialog({ class: props.class }));

const setElement = (next: unknown) => {
  element.value = (next as HTMLElement | null) ?? null;
};

/**
 * Focus the dialog itself once it appears, unless something inside already has focus.
 *
 * Without this a keyboard user is left on the trigger with the dialog open beside them, and a
 * screen reader never enters it. Never scrolls: the popover is positioned by measurement, and
 * letting focus scroll the page under it would leave it beside nothing.
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
    :id="scope?.dialogId.value"
    :ref="setElement"
    :aria-labelledby="labelledBy"
    :class="styles"
    data-slot="popover-dialog"
    role="dialog"
    tabindex="-1"
  >
    <slot :close="target.state.close" />
  </section>
</template>
