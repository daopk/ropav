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
import {useVirtualizerStateContext} from "../virtualizer/virtualizer.context";

import {provideListBoxItemContext} from "./list-box-item.context";

const props = defineProps<ListBoxItemRootProps>();

defineSlots<{default?: (props: ListBoxItemSlotProps) => unknown}>();

const {
  collection,
  collectionId,
  dragAndDropHooks,
  dragState,
  dropState,
  keyboard,
  listId,
  onAction,
  selection,
  shouldFocusOnHover,
  shouldUseVirtualFocus,
} = useListBoxContext();

const virtualizer = useVirtualizerStateContext();

/**
 * Where this option sits in the whole set.
 *
 * Only emitted when the listbox is virtualized: without the window, the options in the DOM *are*
 * the set, and a screen reader counts them itself. With one, most of the set is absent, so the
 * position and the total have to be stated.
 */
const positionInSet = computed(() => {
  if (!virtualizer) return undefined;

  const index = virtualizer.getIndex(itemKey.value);

  return index < 0 ? undefined : index + 1;
});

const setSize = computed(() => (virtualizer ? virtualizer.itemCount.value : undefined));

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
  isFocusVisible: isRealFocusVisible,
  isFocused: isRealFocused,
  isHovered,
  isPressed,
  onBlur,
  onFocus: onFocusState,
  onPointerdown,
  onPointerenter: onPointerenterState,
  onPointerleave,
} = useInteractionStates({isDisabled: () => isDisabled.value});

/**
 * Whether the collection considers this the focused option without any element being focused.
 *
 * The interaction states above are built out of focus events, and under virtual focus no element
 * inside the listbox ever receives one — the caret is in a control beside it. So the focused key
 * is the only thing left that knows, and without reading it an option arrowed to would carry no
 * ring at all.
 */
const isVirtuallyFocused = computed(
  () => shouldUseVirtualFocus.value && selection.focusedKey.value === itemKey.value,
);

const isFocused = computed(() => isRealFocused.value || isVirtuallyFocused.value);

const isFocusVisible = computed(() => isRealFocusVisible.value || isVirtuallyFocused.value);

/**
 * Hovering an option moves focus to it, but only inside a picker.
 *
 * There the pointer and the keyboard drive the same single choice, so the highlight has to follow
 * the mouse — otherwise the next arrow press would jump back to whatever the keyboard last
 * touched. A listbox standing on its own leaves focus alone, which is what React Aria does too:
 * `shouldFocusOnHover` is off by default and only `useSelect` turns it on.
 */
const onPointerenter = (event: PointerEvent) => {
  onPointerenterState(event);

  if (!shouldFocusOnHover.value || isDisabled.value || isFocusVisible.value) return;

  selection.setFocused(true);
  keyboard.focusKey(itemKey.value);
};

/**
 * Keep the collection's focused key on whatever actually holds focus.
 *
 * Focus can arrive without the collection having moved it — a click, a screen reader stepping
 * through, `.focus()` from anywhere — and a focused key that disagrees with real focus leaves the
 * roving tab stop on one item while the ring is on another.
 */
const onFocus = (event: FocusEvent) => {
  onFocusState();

  if (event.target !== element.value) return;

  // Claimed before the collection sees the same event bubbling, so it leaves this key alone
  // instead of picking an entry key of its own.
  selection.setFocused(true);
  selection.setFocusedKey(itemKey.value);
};

/* -------------------------------------------------------------------------------------------------
 * Drag and drop
 * -----------------------------------------------------------------------------------------------*/

/**
 * An option drags itself rather than offering a handle.
 *
 * `hasAction` is what moves the keyboard gesture to Alt+Enter: a listbox item already does
 * something on Enter — selects, or fires an action — so plain Enter cannot also mean "drag me".
 * A row in a table is different, which is why that side gets a drag button instead.
 */
const draggable =
  dragState && dragAndDropHooks?.useDraggableItem
    ? dragAndDropHooks.useDraggableItem({hasAction: true, key: itemKey.value}, dragState)
    : null;

const droppable =
  dropState && dragAndDropHooks?.useDroppableItem
    ? dragAndDropHooks.useDroppableItem(
        {target: {dropPosition: "on", key: itemKey.value, type: "item"}},
        dropState,
        element,
      )
    : null;

const isDragging = computed(() => dragState?.isDragging(itemKey.value) ?? false);
const isDropTarget = computed(() => droppable?.isDropTarget.value ?? false);

/**
 * Attributes from both halves, merged. Never listeners — see §3.4.
 *
 * `aria-describedby` is pulled out and merged by hand below: the item already binds one for its
 * description slot, and an explicit binding beats `v-bind` whichever order they appear in, so
 * leaving it here would silently drop the drag instructions.
 */
const dndAttrs = computed(() => {
  const {["aria-describedby"]: _drag, ...drag} = draggable?.attrs.value ?? {};
  const {["aria-describedby"]: _drop, ...drop} = droppable?.attrs.value ?? {};

  return {...drag, ...drop};
});

/** The drag instructions, or the item's own description when there is no drag to describe. */
const describedBy = computed(
  () =>
    (draggable?.attrs.value["aria-describedby"] as string | undefined) ??
    fieldIds.describedBy.value,
);

const onClick = (event: MouseEvent) => {
  draggable?.handlers.onClick?.(event);
  droppable?.handlers.onClick();

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
    :aria-describedby="describedBy"
    :aria-disabled="isDisabled || undefined"
    :aria-posinset="positionInSet"
    :aria-selected="selectionMode === 'none' ? undefined : isSelected"
    :aria-setsize="setSize"
    :class="slots.item({class: props.class})"
    v-bind="dndAttrs"
    :data-allows-dragging="dataAttr(draggable != null)"
    :data-collection="collectionId"
    :data-disabled="dataAttr(isDisabled)"
    :data-dragging="dataAttr(isDragging)"
    :data-drop-target="dataAttr(isDropTarget)"
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
    @drag="draggable?.handlers.onDrag($event)"
    @dragend="draggable?.handlers.onDragend($event)"
    @dragstart="draggable?.handlers.onDragstart($event)"
    @focus="onFocus"
    @keydown.capture="draggable?.handlers.onKeydownCapture?.($event)"
    @keyup.capture="draggable?.handlers.onKeyupCapture?.($event)"
    @pointerdown="onPointerdown"
    @pointerenter="onPointerenter"
    @pointerleave="onPointerleave"
  >
    <slot
      :is-disabled="isDisabled"
      :is-dragging="isDragging"
      :is-drop-target="isDropTarget"
      :is-focus-visible="isFocusVisible"
      :is-focused="isFocused"
      :is-hovered="isHovered"
      :is-pressed="isPressed"
      :is-selected="isSelected"
      :selection-mode="selectionMode"
    />
  </div>
</template>
