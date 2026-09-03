<script setup lang="ts" vapor>
import type { DropEvent, DropItem, DropOperation } from "../../utils/dnd-types";
import type { DropZoneRootProps, DropZoneSlotProps, DropZoneStatus } from "./drop-zone.types";

import { dropZoneVariants } from "@ropav/styles";
import { computed, shallowRef } from "vue";

import { isVirtualDragging } from "../../composables/drag-manager";
import { useDrop } from "../../composables/use-drop";
import { useFocusWithin, useInteractionStates } from "../../composables/use-interaction-states";
import { dataAttr } from "../../utils/assertion";
import { isDirectoryDropItem, isFileDropItem } from "../../utils/dnd-types";
import { visuallyHiddenStyle } from "../../utils/visually-hidden";

import { isDragRefused, isFileAccepted, parseAccept } from "./drop-zone.accept";
import { provideDropZoneContext } from "./drop-zone.context";

const props = defineProps<DropZoneRootProps>();

const emit = defineEmits<{
  /** Files the zone took, from a drop or from the picker. Never emitted empty. */
  select: [files: File[]];
}>();

defineSlots<{ default?: (props: DropZoneSlotProps) => unknown }>();

const rootEl = shallowRef<HTMLElement | null>(null);
const inputEl = shallowRef<HTMLInputElement | null>(null);

const setRootEl = (element: unknown) => {
  rootEl.value = element instanceof HTMLElement ? element : null;
};

const setInputEl = (element: unknown) => {
  inputEl.value = element instanceof HTMLInputElement ? element : null;
};

const acceptTokens = computed(() => parseAccept(props.accept));

/** Refused drags are still entered, so the zone can say no rather than ignore the pointer. */
const isRefusing = shallowRef(false);

// The zone paints hover from the pointer, and the ring from whatever inside it holds focus —
// which is the hidden input, the control a keyboard reaches this component through.
const interaction = useInteractionStates({ isDisabled: () => props.isDisabled });
const focusWithin = useFocusWithin({ isDisabled: () => props.isDisabled });

/**
 * Flattens a drop into plain files, walking any directory that came with it.
 *
 * `for await` covers both the array a drop arrives as and the async iterable a directory hands
 * back, so one function serves both levels.
 */
const collectFiles = async (
  items: AsyncIterable<DropItem> | Iterable<DropItem>,
): Promise<File[]> => {
  const files: File[] = [];

  for await (const item of items) {
    if (isFileDropItem(item)) {
      files.push(await item.getFile());
    } else if (isDirectoryDropItem(item)) {
      files.push(...(await collectFiles(item.getEntries())));
    }
  }

  return files;
};

/**
 * What the zone hands on, out of what arrived.
 *
 * Filtering rather than reporting: the browser already filters the picker half silently from
 * the same `accept`, and enforces `multiple` there on its own, so the drop half matches that
 * instead of inventing an error channel this component has no way to show.
 */
const takeable = (files: File[]): File[] => {
  const accepted = files.filter((file) => isFileAccepted(file, acceptTokens.value));

  return props.multiple ? accepted : accepted.slice(0, 1);
};

const announce = (files: File[]) => {
  if (files.length > 0) emit("select", files);
};

const drop = useDrop({
  getDropOperation: (types): DropOperation => {
    isRefusing.value = isDragRefused(types, acceptTokens.value);

    // A refused drag is still taken as a target, because "cancel" would leave `isDropTarget`
    // false and the zone could only ignore the drag rather than show it saying no. The
    // refusal is enforced on drop instead.
    return "copy";
  },
  // The hidden input is the focusable control here, so the instructions for an accessible
  // drop belong on it rather than on this region.
  hasDropButton: true,
  isDisabled: () => props.isDisabled,
  onDrop: (event: DropEvent) => {
    if (isRefusing.value) return;

    void collectFiles(event.items).then((files) => announce(takeable(files)));
  },
  onDropExit: () => {
    isRefusing.value = false;
  },
  ref: rootEl,
});

const status = computed<DropZoneStatus>(() => {
  if (!drop.isDropTarget.value) return "idle";

  return isRefusing.value ? "reject" : "accept";
});

const open = () => {
  if (props.isDisabled) return;

  inputEl.value?.click();
};

const onClick = (event: MouseEvent) => {
  // `open()` clicks the input, and that click bubbles straight back here. Without this the
  // zone would reopen the picker for as long as the stack allowed.
  if (event.target === inputEl.value) return;

  // A screen reader drop is a click the drag session reads off the document, so while one is
  // in flight the click is left to it rather than answered with a file picker.
  if (isVirtualDragging()) return;

  open();
};

const onInputChange = (event: Event) => {
  const input = event.target as HTMLInputElement;

  announce(takeable(Array.from(input.files ?? [])));

  // Choosing the same file twice has to count twice, and a picker that opens and is cancelled
  // must not re-announce the previous choice. Neither holds while the value stays put.
  input.value = "";
};

/** The drag instructions, plus whatever help text the caller wired up. */
const describedBy = computed(() => {
  const ids = [drop.dropButtonAttrs.value["aria-describedby"], props.ariaDescribedby].filter(
    Boolean,
  );

  return ids.length > 0 ? ids.join(" ") : undefined;
});

const styles = computed(() => dropZoneVariants());

provideDropZoneContext({ slots: styles });
</script>

<template>
  <div
    :ref="setRootEl"
    :class="styles.base({ class: props.class })"
    :data-disabled="dataAttr(props.isDisabled)"
    :data-drop-target="dataAttr(drop.isDropTarget.value)"
    :data-focus-visible="dataAttr(focusWithin.isFocusVisible.value)"
    :data-hovered="dataAttr(interaction.isHovered.value)"
    :data-status="status"
    data-slot="drop-zone"
    :tabindex="-1"
    @click="onClick"
    @dragenter="drop.handlers.onDragenter"
    @dragleave="drop.handlers.onDragleave"
    @dragover="drop.handlers.onDragover"
    @drop="drop.handlers.onDrop"
    @focusin="focusWithin.onFocusin"
    @focusout="focusWithin.onFocusout"
    @pointerenter="interaction.onPointerenter"
    @pointerleave="interaction.onPointerleave"
  >
    <span :style="visuallyHiddenStyle">
      <input
        :ref="setInputEl"
        :accept="props.accept"
        :aria-describedby="describedBy"
        :aria-label="props.ariaLabel"
        :aria-labelledby="props.ariaLabelledby"
        :disabled="props.isDisabled || undefined"
        :multiple="props.multiple || undefined"
        type="file"
        @change="onInputChange"
      />
    </span>
    <slot
      :is-disabled="Boolean(props.isDisabled)"
      :is-drop-target="drop.isDropTarget.value"
      :open="open"
      :status="status"
    />
  </div>
</template>
