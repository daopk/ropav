import type {DragKey} from "../utils/dnd-types";
import type {UseDragHandlers} from "./use-drag";
import type {UseDraggableCollectionStateReturn} from "./use-draggable-collection-state";
import type {PressEvent} from "./use-press";
import type {ComputedRef, MaybeRefOrGetter} from "vue";

import {computed, toValue} from "vue";

import {dndStrings} from "../i18n/dnd";
import {clearGlobalDnDState, isInternalDropOperation, setDraggingKeys} from "../utils/dnd-state";

import {useDragModality} from "./drag-modality";
import {useDescription} from "./use-description";
import {useDrag} from "./use-drag";
import {useLocalizedStringFormatter} from "./use-localized-string-formatter";

export interface UseDraggableItemOptions {
  key: DragKey;
  /** Whether a separate focusable control starts the accessible drag for this item. */
  hasDragButton?: MaybeRefOrGetter<boolean | undefined>;
  /**
   * Whether the item already does something on Enter or long press.
   *
   * When it does, that gesture cannot also mean "drag me" — so the keyboard path moves to
   * Alt+Enter and the long-press hint is dropped, because long press selects instead.
   */
  hasAction?: MaybeRefOrGetter<boolean | undefined>;
}

export interface UseDraggableItemReturn {
  attrs: ComputedRef<Record<string, unknown>>;
  handlers: UseDragHandlers;
  dragButtonAttrs: ComputedRef<{
    "aria-describedby": string | undefined;
    "aria-label": string | undefined;
    isDisabled: boolean;
  }>;
  onDragButtonPress: (event: PressEvent) => void;
}

/** How to start a drag, phrased for the modality and for whether a selection travels with it. */
const DESCRIPTION_KEYS = {
  keyboard: {notSelected: "dragDescriptionKeyboard", selected: "dragSelectedKeyboard"},
  touch: {notSelected: "dragDescriptionLongPress", selected: "dragSelectedLongPress"},
  virtual: {notSelected: "dragDescriptionVirtual", selected: "dragDescriptionVirtual"},
} as const;

/**
 * Drag behaviour for one item of a collection, ported from React Aria's `useDraggableItem`.
 *
 * A thin layer over `useDrag`, and almost all of it is about what the user is told: an item that
 * is part of a multi-item selection has to announce how many items the drag will carry, because
 * nothing on screen says so once the drag begins.
 */
export const useDraggableItem = (
  options: UseDraggableItemOptions,
  state: UseDraggableCollectionStateReturn<unknown>,
): UseDraggableItemReturn => {
  const stringFormatter = useLocalizedStringFormatter(dndStrings);
  const modality = useDragModality();
  const isDisabled = computed(
    () => state.isDisabled.value || state.selectionManager.isDisabled(options.key),
  );
  const hasDragButton = () => Boolean(toValue(options.hasDragButton));
  const hasAction = () => Boolean(toValue(options.hasAction));

  const drag = useDrag({
    getAllowedDropOperations: state.getAllowedDropOperations,
    getItems: () => state.getItems(options.key),
    hasDragButton: options.hasDragButton,
    onDragEnd(event) {
      // A cancelled drop never landed anywhere, so it cannot have been internal whatever the
      // global state still says.
      const isInternal = event.dropOperation === "cancel" ? false : isInternalDropOperation();

      state.endDrag({...event, isInternal, keys: state.draggingKeys.value});
      clearGlobalDnDState();
    },
    onDragMove: (event) => state.moveDrag(event),
    onDragStart(event) {
      state.startDrag(options.key, event);
      // Published globally so the drop side can recognise its own items — that is what tells a
      // reorder apart from an insert.
      setDraggingKeys(state.draggingKeys.value);
    },
    preview: state.preview,
  });

  /** How many items this drag would carry, and whether that is more than the one grabbed. */
  const dragCount = computed(() => state.getKeysForDrag(options.key).size);
  const isSelected = computed(
    () => dragCount.value > 1 && state.selectionManager.isSelected(options.key),
  );

  /** Present only when the item itself carries the accessible drag and can be selected. */
  const description = computed(() => {
    if (hasDragButton() || state.selectionManager.selectionMode.value === "none") return undefined;

    const keys = DESCRIPTION_KEYS[modality.value];
    let key: string = isSelected.value ? keys.selected : keys.notSelected;

    // Enter already means "activate" here, so the drag needs a modifier.
    if (hasAction() && modality.value === "keyboard") key += "Alt";

    return isSelected.value
      ? stringFormatter.value.format(key as never, {count: dragCount.value})
      : stringFormatter.value.format(key as never);
  });

  const {describedBy} = useDescription(description);

  const dragButtonLabel = computed(() => {
    if (description.value !== undefined) return undefined;

    if (isSelected.value) {
      return stringFormatter.value.format("dragSelectedItems", {count: dragCount.value});
    }

    const itemText = state.collection.getItem(options.key)?.textValue ?? "";

    return stringFormatter.value.format("dragItem", {itemText});
  });

  return {
    attrs: computed(() => {
      if (isDisabled.value) return {};

      const attrs: Record<string, unknown> = {...drag.attrs.value};

      if (description.value !== undefined) {
        // A long press selects rather than drags when the item has an action, so promising
        // otherwise would be a lie.
        attrs["aria-describedby"] =
          hasAction() && modality.value === "touch" ? undefined : describedBy.value;
      }

      return attrs;
    }),
    dragButtonAttrs: computed(() => ({
      // The description belongs to the control that starts the drag, and with a drag button
      // that is this one rather than the item — so it has to be carried through from `useDrag`.
      ...drag.dragButtonAttrs.value,
      "aria-label": dragButtonLabel.value,
      isDisabled: isDisabled.value,
    })),
    handlers: {
      ...drag.handlers,
      /**
       * Dropped entirely when the item is part of a selectable collection.
       *
       * Touch needs a long press instead, and NVDA and JAWS are always in forms mode inside a
       * collection, so a click here would only ever be a real one — which means "select".
       */
      onClick: description.value !== undefined ? undefined : (drag.handlers.onClick as never),
      onKeydownCapture: (event: KeyboardEvent) => {
        if (isDisabled.value) return;
        if (!hasDragButton() && hasAction() && !event.altKey) return;
        drag.handlers.onKeydownCapture?.(event);
      },
      onKeyupCapture: (event: KeyboardEvent) => {
        if (isDisabled.value) return;
        if (!hasDragButton() && hasAction() && !event.altKey) return;
        drag.handlers.onKeyupCapture?.(event);
      },
    },
    onDragButtonPress: drag.onDragButtonPress,
  };
};
