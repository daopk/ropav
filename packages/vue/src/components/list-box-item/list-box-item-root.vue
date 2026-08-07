<script setup lang="ts" vapor>
import type {ListBoxItemRootProps, ListBoxItemSlotProps} from "./list-box-item.types";

import {listboxItemVariants} from "@heroui/styles";
import {computed, shallowRef, watch} from "vue";

import {provideFieldIdsContext, useFieldIds} from "../../composables/use-field-ids";
import {useId} from "../../composables/use-id";
import {useInteractionStates} from "../../composables/use-interaction-states";
import {dataAttr} from "../../utils/assertion";
import {getCollectionTextValue} from "../../utils/text-value";
import {useListBoxContext} from "../list-box/list-box.context";

import {provideListBoxItemContext} from "./list-box-item.context";

const props = defineProps<ListBoxItemRootProps>();

defineSlots<{default?: (props: ListBoxItemSlotProps) => unknown}>();

const {collection, collectionId, keyboard, listId, onAction, selection} = useListBoxContext();

const slots = computed(() => listboxItemVariants({variant: props.variant}));

// Falls back to a generated key so an item without an `id` still has a stable identity.
const generatedKey = useId();
const itemKey = computed(() => props.id ?? generatedKey.value);

const element = shallowRef<HTMLElement | null>(null);

// Registered post-flush so the element is attached before the collection asks the DOM where it
// sits. Metadata is handed over as getters, so a later prop change needs no re-registration.
watch(
  element,
  (current, _previous, onCleanup) => {
    if (!current) return;

    onCleanup(
      collection.register(itemKey.value, {
        element: () => element.value,
        isDisabled: () => Boolean(props.isDisabled),
        textValue: () => props.textValue ?? getCollectionTextValue(element.value),
      }),
    );
  },
  {flush: "post", immediate: true},
);

const isSelected = computed(() => selection.isSelected(itemKey.value));
const isDisabled = computed(() => selection.isDisabled(itemKey.value));
const selectionMode = computed(() => selection.selectionMode.value);

// Only the description slot is wired: the item names itself from its content, exactly as the
// React build does, so handing out a label id would add an attribute nothing points at.
const fieldIds = useFieldIds({slots: ["description"]});

provideFieldIdsContext(fieldIds.context);
provideListBoxItemContext({isSelected, slots});

const {
  isFocusVisible,
  isFocused,
  isHovered,
  isPressed,
  onBlur,
  onFocus: onFocusState,
  onPointerdown,
  onPointerenter,
  onPointerleave,
} = useInteractionStates({isDisabled: () => isDisabled.value});

/**
 * Keep the collection's focused key on whatever actually holds focus.
 *
 * Focus can arrive without the collection having moved it — a click, a screen reader stepping
 * through, `.focus()` from anywhere — and a focused key that disagrees with real focus leaves the
 * roving tab stop on one item while the ring is on another.
 */
const onFocus = (event: FocusEvent) => {
  onFocusState();

  if (event.target === element.value) selection.setFocusedKey(itemKey.value);
};

const onClick = (event: MouseEvent) => {
  if (isDisabled.value) return;

  keyboard.focusKey(itemKey.value);

  if (selectionMode.value === "none") {
    onAction?.(itemKey.value);

    return;
  }

  selection.select(itemKey.value, {
    isCtrlPressed: event.ctrlKey || event.metaKey,
    isShiftPressed: event.shiftKey,
  });
};
</script>

<template>
  <div
    :id="`${listId}-option-${itemKey}`"
    ref="element"
    :aria-describedby="fieldIds.describedBy.value"
    :aria-disabled="isDisabled || undefined"
    :aria-selected="selectionMode === 'none' ? undefined : isSelected"
    :class="slots.item({class: props.class})"
    :data-collection="collectionId"
    :data-disabled="dataAttr(isDisabled)"
    :data-focus-visible="dataAttr(isFocusVisible)"
    :data-focused="dataAttr(isFocused)"
    :data-hovered="dataAttr(isHovered)"
    :data-key="itemKey"
    :data-pressed="dataAttr(isPressed)"
    :data-selected="dataAttr(isSelected)"
    :data-selection-mode="selectionMode === 'none' ? undefined : selectionMode"
    data-slot="list-box-item"
    role="option"
    :tabindex="keyboard.itemTabIndex(itemKey)"
    @blur="onBlur"
    @click="onClick"
    @focus="onFocus"
    @pointerdown="onPointerdown"
    @pointerenter="onPointerenter"
    @pointerleave="onPointerleave"
  >
    <slot
      :is-disabled="isDisabled"
      :is-focus-visible="isFocusVisible"
      :is-focused="isFocused"
      :is-hovered="isHovered"
      :is-pressed="isPressed"
      :is-selected="isSelected"
      :selection-mode="selectionMode"
    />
  </div>
</template>
