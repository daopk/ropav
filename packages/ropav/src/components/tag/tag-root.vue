<script setup lang="ts" vapor>
import type { TagRootProps, TagSlotProps } from "./tag.types";

import { tagVariants } from "@ropav/styles";
import { computed, shallowRef, watch } from "vue";

import { useId } from "../../composables/use-id";
import { useInteractionStates } from "../../composables/use-interaction-states";
import { dataAttr } from "../../utils/assertion";
import { getCollectionTextValue } from "../../utils/text-value";
import { useTagGroupContext } from "../tag-group/tag-group.context";

import TagRemoveButton from "./tag-remove-button.vue";
import { provideTagContext } from "./tag.context";

const props = defineProps<TagRootProps>();

defineSlots<{ default?: (props: TagSlotProps) => unknown; remove?: () => unknown }>();

const {
  allowsRemoving,
  collection,
  collectionId,
  keyboard,
  listId,
  removeKeys,
  selection,
  size,
  variant,
} = useTagGroupContext();

const slots = computed(() => tagVariants({ size: size.value, variant: variant.value }));

const generatedKey = useId();
const tagKey = computed(() => props.id ?? generatedKey.value);

const element = shallowRef<HTMLElement | null>(null);

watch(
  element,
  (current, _previous, onCleanup) => {
    if (!current) return;

    onCleanup(
      collection.register(tagKey.value, {
        element: () => element.value,
        isDisabled: () => Boolean(props.isDisabled),
        textValue: () => props.textValue ?? getCollectionTextValue(element.value),
      }),
    );
  },
  { flush: "post", immediate: true },
);

const isSelected = computed(() => selection.isSelected(tagKey.value));
const isDisabled = computed(() => selection.isDisabled(tagKey.value));

/**
 * A tag's tab order differs from a list option's: every enabled tag is a tab stop until focus
 * lands somewhere, and only then does it collapse to roving. Matches React Aria's `useTag`.
 */
const tabIndex = computed(() => {
  if (isDisabled.value) return -1;

  const focused = selection.focusedKey.value;

  return focused === null || focused === tagKey.value ? 0 : -1;
});

// Announced name: the caller's text when given, otherwise whatever the tag reads as. React
// derives this from its children; here it comes back off the DOM instead.
const label = computed(() => props.textValue ?? getCollectionTextValue(element.value));

const remove = () => {
  // A selected tag takes the rest of the selection with it, which is what makes removing a
  // multi-selection one gesture rather than several.
  if (isSelected.value && selection.selectedKeys.value.size > 0) {
    removeKeys(selection.selectedKeys.value);

    return;
  }

  removeKeys([tagKey.value]);
};

provideTagContext({ remove, slots, tagKey });

const {
  isFocusVisible,
  isFocused,
  isHovered,
  isPressed,
  onBlur,
  onFocus,
  onPointerdown,
  onPointerenter,
  onPointerleave,
} = useInteractionStates({ isDisabled: () => isDisabled.value });

/*
 * A row needs a cell to hold its content, and `display: contents` keeps that cell out of the
 * layout entirely — so the tag's own flex rules still apply to the content directly. React
 * renders the same wrapper for the same reason, rather than styling the row itself.
 */

const onClick = (event: MouseEvent) => {
  if (isDisabled.value) return;

  keyboard.focusKey(tagKey.value);
  selection.select(tagKey.value, {
    isCtrlPressed: event.ctrlKey || event.metaKey,
    isShiftPressed: event.shiftKey,
  });
};

const onKeydown = (event: KeyboardEvent) => {
  if (!allowsRemoving.value || isDisabled.value) return;
  if (event.key !== "Delete" && event.key !== "Backspace") return;

  event.preventDefault();
  remove();
};
</script>

<template>
  <div
    :id="`${listId}-${tagKey}`"
    ref="element"
    :aria-disabled="isDisabled || undefined"
    :aria-label="label"
    :aria-selected="selection.canSelectItem(tagKey) ? isSelected : undefined"
    :class="slots.base({ class: props.class })"
    :data-allows-removing="dataAttr(allowsRemoving)"
    :data-collection="collectionId"
    :data-disabled="dataAttr(isDisabled)"
    :data-focus-visible="dataAttr(isFocusVisible)"
    :data-focused="dataAttr(isFocused)"
    :data-hovered="dataAttr(isHovered)"
    :data-key="tagKey"
    :data-pressed="dataAttr(isPressed)"
    :data-selected="dataAttr(isSelected)"
    :data-selection-mode="
      selection.selectionMode.value === 'none' ? undefined : selection.selectionMode.value
    "
    data-slot="tag"
    role="row"
    :tabindex="tabIndex"
    @blur="onBlur"
    @click="onClick"
    @focus="onFocus"
    @keydown="onKeydown"
    @pointerdown="onPointerdown"
    @pointerenter="onPointerenter"
    @pointerleave="onPointerleave"
  >
    <div aria-colindex="1" role="gridcell" style="display: contents">
      <slot
        :is-disabled="isDisabled"
        :is-focus-visible="isFocusVisible"
        :is-focused="isFocused"
        :is-hovered="isHovered"
        :is-pressed="isPressed"
        :is-selected="isSelected"
      />
      <slot v-if="allowsRemoving" name="remove">
        <TagRemoveButton />
      </slot>
    </div>
  </div>
</template>
