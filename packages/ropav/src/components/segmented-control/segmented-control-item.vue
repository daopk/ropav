<script setup lang="ts" vapor>
import type {
  SegmentedControlItemProps,
  SegmentedControlItemSlotProps,
} from "./segmented-control.types";

import { computed, shallowRef, watch } from "vue";

import { useInteractionStates } from "../../composables/use-interaction-states";
import { dataAttr } from "../../utils/assertion";
import { getCollectionTextValue } from "../../utils/text-value";

import {
  provideSegmentedControlItemContext,
  useSegmentedControlContext,
} from "./segmented-control.context";

const props = withDefaults(defineProps<SegmentedControlItemProps>(), { isDisabled: undefined });

defineSlots<{ default?: (props: SegmentedControlItemSlotProps) => unknown }>();

const { isDisabled: isControlDisabled, keyboard, slots, state } = useSegmentedControlContext();

const itemKey = computed(() => props.id);

const element = shallowRef<HTMLElement | null>(null);

/*
 * Registration happens in a watcher rather than in the template ref: the collection bumps a
 * counter as it registers, and an increment reads before it writes — so registering from inside
 * a tracked scope would make that scope depend on the counter it just changed.
 */
watch(
  element,
  (current, _previous, onCleanup) => {
    if (!current) return;

    onCleanup(
      state.collection.register(itemKey.value, {
        element: () => element.value,
        isDisabled: () => Boolean(props.isDisabled),
        textValue: () => props.textValue ?? getCollectionTextValue(element.value),
      }),
    );
  },
  { flush: "post", immediate: true },
);

const isSelected = computed(() => state.selectedKey.value === itemKey.value);
const isDisabled = computed(
  () => isControlDisabled.value || state.selection.isDisabled(itemKey.value),
);

const {
  isFocusVisible,
  isFocused,
  isHovered,
  isPressed,
  onBlur,
  onFocus,
  onPointerdown: onPointerdownState,
  onPointerenter,
  onPointerleave,
} = useInteractionStates({ isDisabled: () => isDisabled.value });

provideSegmentedControlItemContext({ isSelected });

/*
 * A segment is chosen as the press begins rather than as it ends, matching the tab list. The
 * synchronous edge is also what lets the outgoing indicator measure itself while it is still
 * laid out where it was. The collection is told to leave Enter and Space alone for the same
 * reason a tab list is, so they are answered here.
 */
const choose = () => {
  if (isDisabled.value) return;

  keyboard.focusKey(itemKey.value);
  state.selection.replaceSelection(itemKey.value);
};

const onPointerdown = (event: PointerEvent) => {
  onPointerdownState(event);
  if (event.button !== 0) return;

  choose();
};

const onKeydown = (event: KeyboardEvent) => {
  if (event.key !== "Enter" && event.key !== " ") return;

  event.preventDefault();
  event.stopPropagation();
  choose();
};
</script>

<template>
  <button
    ref="element"
    :aria-checked="isSelected"
    :aria-label="props.ariaLabel"
    :class="slots.item({ class: props.class })"
    :data-disabled="dataAttr(isDisabled)"
    :data-focus-visible="dataAttr(isFocusVisible)"
    :data-focused="dataAttr(isFocused)"
    :data-hovered="dataAttr(isHovered)"
    :data-key="itemKey"
    :data-pressed="dataAttr(isPressed)"
    :data-selected="dataAttr(isSelected)"
    data-slot="segmented-control-item"
    :disabled="isDisabled || undefined"
    role="radio"
    :tabindex="isDisabled ? undefined : keyboard.itemTabIndex(itemKey)"
    type="button"
    @blur="onBlur"
    @focus="onFocus"
    @keydown="onKeydown"
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
    />
  </button>
</template>
