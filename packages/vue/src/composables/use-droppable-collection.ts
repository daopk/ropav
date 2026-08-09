import type {UseDropHandlers} from "./use-drop";
import type {
  UseDroppableCollectionStateOptions,
  UseDroppableCollectionStateReturn,
} from "./use-droppable-collection-state";
import type {
  DragCollection,
  DragKey,
  DragKeyboardDelegate,
  DropEvent,
  DropOperation,
  DropPosition,
  DropTarget,
  DropTargetDelegate,
  DroppableCollectionActivateEvent,
  DroppableCollectionDropEvent,
} from "../utils/dnd-types";
import type {ComputedRef, ShallowRef} from "vue";

import {computed, onScopeDispose, useId, watch} from "vue";

import {DIRECTORY_DRAG_TYPE} from "../utils/dnd-constants";
import {dragTypesFromSet, getTypes} from "../utils/dnd-data-transfer";
import {navigateDropTarget} from "../utils/dnd-drop-target-navigation";
import {
  clearGlobalDnDState,
  globalDndState,
  isInternalDropOperation,
  setDropCollectionRef,
} from "../utils/dnd-state";

import {registerDropTarget} from "./drag-manager";
import {registerDroppableCollection} from "./droppable-collection-registry";
import {useAutoScroll} from "./use-auto-scroll";
import {useDrop} from "./use-drop";
import {setInteractionModality} from "./use-interaction-states";
import {useLocale} from "./use-locale";

/** Extra keys a collection's keyboard delegate may offer beyond the drag navigation ones. */
export interface DroppableCollectionKeyboardDelegate extends DragKeyboardDelegate {
  getKeyPageAbove?: (key: DragKey) => DragKey | null;
  getKeyPageBelow?: (key: DragKey) => DragKey | null;
}

export interface UseDroppableCollectionOptions extends Omit<
  UseDroppableCollectionStateOptions<unknown>,
  "collection" | "selectionManager"
> {
  keyboardDelegate: DroppableCollectionKeyboardDelegate;
  /** Resolves a pointer position to a drop target. */
  dropTargetDelegate: DropTargetDelegate;
  /**
   * Called once a valid drag has rested on a target long enough to open it.
   *
   * Declared here rather than on the state options because the state layer deliberately omits
   * it — activating is a behaviour of the collection, not a decision about what is allowed.
   */
  onDropActivate?: (event: DroppableCollectionActivateEvent) => void;
  onKeyDown?: (event: KeyboardEvent) => void;
}

export interface UseDroppableCollectionReturn {
  attrs: ComputedRef<{id: string; "aria-describedby": undefined}>;
  handlers: UseDropHandlers;
}

/** How long to wait for a drop handler's async work before deciding where focus lands. */
const FOCUS_AFTER_DROP_DELAY = 50;

/** What the collection looked like when a drop began, for comparing against afterwards. */
interface DroppingState {
  collectionSize: number;
  keys: Set<DragKey>;
  focusedKey: DragKey | null;
  selectedKeys: Set<DragKey>;
  target: DropTarget;
  draggingKeys: Set<DragKey>;
  isInternal: boolean;
  timeout: ReturnType<typeof setTimeout> | undefined;
}

const collectionKeys = (collection: DragCollection<unknown>): Set<DragKey> =>
  new Set(collection.getKeys());

/**
 * Drop behaviour for a whole collection, ported from React Aria's `useDroppableCollection`.
 *
 * Ties the three layers together: `useDrop` for the pointer, the drag session for the keyboard,
 * and the drop state for deciding what is allowed. Most of the length is the keyboard half —
 * a pointer picks a target directly, whereas every arrow key has to search for the next target
 * that would actually accept the drag.
 */
export const useDroppableCollection = (
  options: UseDroppableCollectionOptions,
  state: UseDroppableCollectionStateReturn<unknown>,
  element: ShallowRef<HTMLElement | null>,
): UseDroppableCollectionReturn => {
  const id = useId();
  const locale = useLocale();
  const autoScroll = useAutoScroll(element);

  registerDroppableCollection(state, {element, id});

  /** The target the pointer last resolved to, held between `getDropOperationForPoint` and enter. */
  let nextTarget: DropTarget | null = null;
  let dropOperation: DropOperation | null = null;
  let droppingState: DroppingState | null = null;

  /* -----------------------------------------------------------------------------------------
   * Dropping
   * ---------------------------------------------------------------------------------------*/

  /**
   * Route a drop to whichever specific handler fits, when the caller gave no `onDrop`.
   *
   * The same gesture means different things by target: between items from outside is an insert,
   * between items from inside is a reorder, onto an item is an item drop.
   */
  const defaultOnDrop = async (event: DroppableCollectionDropEvent) => {
    const accepted = options.acceptedDragTypes ?? "all";
    const {draggingKeys} = globalDndState;
    const isInternal = isInternalDropOperation(element);
    const {dropOperation: operation, items, target} = event;

    let filtered = items;

    if (accepted !== "all" || options.shouldAcceptItemDrop) {
      filtered = items.filter((item) => {
        // A directory has no mime type of its own, and a file reports one rather than a set.
        const itemTypes =
          item.kind === "directory"
            ? new Set<string | symbol>([DIRECTORY_DRAG_TYPE])
            : item.kind === "file"
              ? new Set<string | symbol>([item.type])
              : new Set<string | symbol>(item.types);

        if (accepted !== "all" && !accepted.some((type) => itemTypes.has(type))) return false;

        // An item may refuse a drop the collection as a whole would take.
        if (
          target.type === "item" &&
          target.dropPosition === "on" &&
          options.shouldAcceptItemDrop
        ) {
          return options.shouldAcceptItemDrop(target, {
            has: (type) => itemTypes.has(type as string),
          });
        }

        return true;
      });
    }

    if (filtered.length === 0) return;

    if (target.type === "root") {
      await options.onRootDrop?.({dropOperation: operation, items: filtered});

      return;
    }

    if (target.dropPosition === "on")
      await options.onItemDrop?.({dropOperation: operation, isInternal, items: filtered, target});

    if (isInternal) await options.onMove?.({dropOperation: operation, keys: draggingKeys, target});

    if (target.dropPosition !== "on") {
      if (!isInternal)
        await options.onInsert?.({dropOperation: operation, items: filtered, target});
      if (isInternal)
        await options.onReorder?.({dropOperation: operation, keys: draggingKeys, target});
    }
  };

  /**
   * Where focus lands once a drop has been applied.
   *
   * The collection has usually changed underneath by now, so this compares against what was
   * recorded at drop time. Inserted items are selected and focused so the user can see what
   * arrived; a reorder focuses the moved row instead.
   */
  const updateFocusAfterDrop = () => {
    if (!droppingState) return;

    const {collectionSize, draggingKeys, focusedKey, isInternal, keys, target} = droppingState;
    const {selectionManager} = state;
    const currentKeys = collectionKeys(state.collection);

    if (currentKeys.size > collectionSize) {
      const inserted = [...currentKeys].filter((key) => !keys.has(key));

      if (inserted.length > 0) {
        selectionManager.setSelectedKeys(inserted);

        if (selectionManager.focusedKey.value === focusedKey) {
          const first = inserted[0]!;

          selectionManager.setFocusedKey(first);
          // With no selection to show for it, the focus ring is the only feedback that
          // anything arrived.
          if (selectionManager.selectionMode.value === "none") setInteractionModality("keyboard");
        }
      }
    } else if (
      focusedKey != null &&
      selectionManager.focusedKey.value === focusedKey &&
      isInternal &&
      target.type === "item" &&
      target.dropPosition !== "on" &&
      draggingKeys.has(state.collection.getItem(focusedKey)?.parentKey ?? "")
    ) {
      // Reordering moves the row, so focus belongs on the row rather than the cell inside it.
      selectionManager.setFocusedKey(state.collection.getItem(focusedKey)?.parentKey ?? null);
      setInteractionModality("keyboard");
    } else if (
      selectionManager.focusedKey.value === focusedKey &&
      target.type === "item" &&
      target.dropPosition === "on" &&
      state.collection.getItem(target.key) != null
    ) {
      selectionManager.setFocusedKey(target.key);
      setInteractionModality("keyboard");
    } else if (
      selectionManager.focusedKey.value != null &&
      !selectionManager.isSelected(selectionManager.focusedKey.value)
    ) {
      setInteractionModality("keyboard");
    }

    selectionManager.setFocused(true);
  };

  const applyDrop = (event: DropEvent, target: DropTarget) => {
    droppingState = {
      collectionSize: collectionKeys(state.collection).size,
      draggingKeys: globalDndState.draggingKeys,
      focusedKey: state.selectionManager.focusedKey.value,
      isInternal: isInternalDropOperation(element),
      keys: collectionKeys(state.collection),
      selectedKeys: state.selectionManager.selectedKeys.value,
      target,
      timeout: undefined,
    };

    void (options.onDrop ?? defaultOnDrop)({
      dropOperation: event.dropOperation,
      items: event.items,
      target,
      type: "drop",
      x: event.x,
      y: event.y,
    });

    // The handler may be async and the collection may take a render to catch up, so focus is
    // settled a moment later — or sooner, if the collection changes first.
    droppingState.timeout = setTimeout(() => {
      updateFocusAfterDrop();
      droppingState = null;
    }, FOCUS_AFTER_DROP_DELAY);
  };

  watch(
    () => collectionKeys(state.collection).size,
    () => {
      if (droppingState) updateFocusAfterDrop();
    },
  );

  onScopeDispose(() => {
    if (droppingState?.timeout) clearTimeout(droppingState.timeout);
  });

  /* -----------------------------------------------------------------------------------------
   * The pointer
   * ---------------------------------------------------------------------------------------*/

  const drop = useDrop({
    getDropOperationForPoint(types, allowedOperations, x, y) {
      const {dropCollectionRef} = globalDndState;
      const isInternal = isInternalDropOperation(element);
      const isValid = (candidate: DropTarget) =>
        state.getDropOperation({
          allowedOperations,
          draggingKeys: globalDndState.draggingKeys,
          isInternal,
          target: candidate,
          types,
        }) !== "cancel";

      let target = options.dropTargetDelegate.getDropTargetFromPoint(x, y, isValid);

      if (!target) {
        dropOperation = "cancel";
        nextTarget = null;

        return "cancel";
      }

      dropOperation = state.getDropOperation({
        allowedOperations,
        draggingKeys: globalDndState.draggingKeys,
        isInternal,
        target,
        types,
      });

      // A gap the collection refuses may still be acceptable as a drop on the collection itself.
      if (dropOperation === "cancel") {
        const rootTarget: DropTarget = {type: "root"};
        const rootOperation = state.getDropOperation({
          allowedOperations,
          draggingKeys: globalDndState.draggingKeys,
          isInternal,
          target: rootTarget,
          types,
        });

        if (rootOperation !== "cancel") {
          target = rootTarget;
          dropOperation = rootOperation;
        }
      }

      if (dropOperation !== "cancel" && element.value !== dropCollectionRef?.value) {
        setDropCollectionRef(element);
      }

      nextTarget = dropOperation === "cancel" ? null : target;

      return dropOperation;
    },
    onDrop(event) {
      setDropCollectionRef(element);

      if (state.target.value) applyDrop(event, state.target.value);

      // A drag from outside leaves no `dragend` of ours to inform, so nothing needs preserving.
      if (globalDndState.draggingCollectionRef == null) clearGlobalDnDState();
    },
    onDropActivate(event) {
      if (state.target.value?.type === "item") {
        options.onDropActivate?.({
          target: state.target.value,
          type: "dropactivate",
          x: event.x,
          y: event.y,
        });
      }
    },
    onDropEnter() {
      if (nextTarget != null) state.setTarget(nextTarget);
    },
    onDropExit() {
      setDropCollectionRef(undefined);
      state.setTarget(null);
      autoScroll.stop();
    },
    onDropMove(event) {
      if (nextTarget != null) state.setTarget(nextTarget);
      autoScroll.move(event.x, event.y);
    },
    ref: element,
  });

  /* -----------------------------------------------------------------------------------------
   * The keyboard
   * ---------------------------------------------------------------------------------------*/

  const getNextTarget = (
    target: DropTarget | null | undefined,
    wrap = true,
    key: "down" | "left" | "right" | "up" = "down",
  ): DropTarget | null =>
    navigateDropTarget(
      options.keyboardDelegate,
      state.collection,
      target,
      key,
      locale.value.direction === "rtl",
      wrap,
    );

  const getPreviousTarget = (target: DropTarget | null | undefined, wrap = true) =>
    getNextTarget(target, wrap, "up");

  /**
   * Keep stepping until a target the drag would actually be accepted by.
   *
   * Most positions in a collection are invalid for any given drag — dropping an item next to
   * itself, say — so a single step would often land nowhere useful. The root is counted because
   * wrapping passes through it, and seeing it twice means the whole collection was searched.
   */
  const nextValidTarget = (
    target: DropTarget | null | undefined,
    types: Set<string>,
    allowedDropOperations: DropOperation[],
    step: (target: DropTarget | null | undefined, wrap: boolean) => DropTarget | null,
    wrap = true,
  ): DropTarget | null => {
    const isInternal = isInternalDropOperation(element);
    const dragTypes = dragTypesFromSet(types);
    let seenRoot = 0;
    let operation: DropOperation;
    let candidate = target;

    do {
      const stepped = step(candidate, wrap);

      if (!stepped) return null;

      candidate = stepped;
      operation = state.getDropOperation({
        allowedOperations: allowedDropOperations,
        draggingKeys: globalDndState.draggingKeys,
        isInternal,
        target: stepped,
        types: dragTypes,
      });

      if (candidate.type === "root") seenRoot++;
    } while (operation === "cancel" && !state.isDropTarget(candidate) && seenRoot < 2);

    return operation === "cancel" ? null : candidate;
  };

  /**
   * Where a keyboard drag starts from when it first enters the collection.
   *
   * After the focused item, so the drop lands where the user was already looking. When that item
   * is part of the selection the anchor moves to the end of it — unless the focus is at the
   * *start* of a multi-item selection, which reads as an intent to move upwards.
   */
  const defaultEnterTarget = (types: Set<string>, allowedDropOperations: DropOperation[]) => {
    const {selectionManager} = state;
    let key = selectionManager.focusedKey.value;
    let dropPosition: DropPosition = "after";

    if (key != null && selectionManager.isSelected(key)) {
      if (
        selectionManager.selectedKeys.value.size > 1 &&
        selectionManager.firstSelectedKey.value === key
      ) {
        dropPosition = "before";
      } else {
        key = selectionManager.lastSelectedKey.value;
      }
    }

    if (key == null) return nextValidTarget(null, types, allowedDropOperations, getNextTarget);

    const target: DropTarget = {dropPosition, key, type: "item"};
    const operation = state.getDropOperation({
      allowedOperations: allowedDropOperations,
      draggingKeys: globalDndState.draggingKeys,
      isInternal: isInternalDropOperation(element),
      target,
      types: dragTypesFromSet(types),
    });

    if (operation !== "cancel") return target;

    return (
      nextValidTarget(target, types, allowedDropOperations, getNextTarget, false) ??
      nextValidTarget(target, types, allowedDropOperations, getPreviousTarget, false)
    );
  };

  /** A page's worth of movement, which has to clamp at both ends rather than stop dead. */
  const pageTarget = (
    direction: "down" | "up",
    types: Set<string>,
    allowedDropOperations: DropOperation[],
  ): DropTarget | null => {
    const {keyboardDelegate} = options;
    let target = state.target.value;

    if (!target) {
      return nextValidTarget(
        null,
        types,
        allowedDropOperations,
        direction === "down" ? getNextTarget : getPreviousTarget,
      );
    }

    if (direction === "up" && target.type === "item") {
      // Already at the top, so the only place further up is the collection itself.
      if (target.key === keyboardDelegate.getFirstKey?.()) return {type: "root"};

      let nextKey = keyboardDelegate.getKeyPageAbove?.(target.key) ?? null;
      let dropPosition = target.dropPosition;

      if (nextKey == null) {
        nextKey = keyboardDelegate.getFirstKey?.() ?? null;
        dropPosition = "before";
      }

      if (nextKey == null) return null;

      target = {dropPosition, key: nextKey, type: "item"};
    } else if (direction === "down") {
      const startKey = target.type === "item" ? target.key : keyboardDelegate.getFirstKey?.();
      let nextKey =
        startKey != null ? (keyboardDelegate.getKeyPageBelow?.(startKey) ?? null) : null;
      let dropPosition: DropPosition = target.type === "item" ? target.dropPosition : "after";

      // Past the end, or already on the last item: jump to the very last position.
      if (
        nextKey == null ||
        (target.type === "item" && target.key === keyboardDelegate.getLastKey?.())
      ) {
        nextKey = keyboardDelegate.getLastKey?.() ?? null;
        dropPosition = "after";
      }

      if (nextKey == null) return null;

      target = {dropPosition, key: nextKey, type: "item"};
    }

    const operation = state.getDropOperation({
      allowedOperations: allowedDropOperations,
      draggingKeys: globalDndState.draggingKeys,
      isInternal: isInternalDropOperation(element),
      target,
      types: dragTypesFromSet(types),
    });

    if (operation !== "cancel") return target;

    const forwards = direction === "down" ? getNextTarget : getPreviousTarget;
    const backwards = direction === "down" ? getPreviousTarget : getNextTarget;

    return (
      nextValidTarget(target, types, allowedDropOperations, forwards, false) ??
      nextValidTarget(target, types, allowedDropOperations, backwards, false)
    );
  };

  watch(
    [element, () => locale.value.direction],
    ([node], _previous, onCleanup) => {
      if (!node) return;

      onCleanup(
        registerDropTarget({
          element: node,
          getDropOperation(types, allowedOperations) {
            const dragTypes = dragTypesFromSet(types);

            if (state.target.value) {
              return state.getDropOperation({
                allowedOperations,
                draggingKeys: globalDndState.draggingKeys,
                isInternal: isInternalDropOperation(element),
                target: state.target.value,
                types: dragTypes,
              });
            }

            // Nothing is targeted yet, so the question is whether *any* position would take it.
            return nextValidTarget(null, types, allowedOperations, getNextTarget)
              ? "move"
              : "cancel";
          },
          onDrop(event, target) {
            setDropCollectionRef(element);

            if (state.target.value) applyDrop(event, target ?? state.target.value);
          },
          onDropActivate(event, target) {
            if (target?.type === "item" && target.dropPosition === "on") {
              options.onDropActivate?.({target, type: "dropactivate", x: event.x, y: event.y});
            }
          },
          onDropEnter(_event, drag) {
            setDropCollectionRef(element);
            state.setTarget(defaultEnterTarget(getTypes(drag.items), drag.allowedDropOperations));
          },
          onDropExit() {
            setDropCollectionRef(undefined);
            state.setTarget(null);
          },
          onDropTargetEnter(target) {
            state.setTarget(target);
          },
          onKeyDown(event, drag) {
            const {keyboardDelegate} = options;
            const types = getTypes(drag.items);
            const allowed = drag.allowedDropOperations;
            const arrow = (key: "down" | "left" | "right" | "up", available: unknown) => {
              if (!available) return;

              state.setTarget(
                nextValidTarget(state.target.value, types, allowed, (target, wrap) =>
                  getNextTarget(target, wrap, key),
                ),
              );
            };

            switch (event.key) {
              case "ArrowDown":
                arrow("down", keyboardDelegate.getKeyBelow);
                break;
              case "ArrowUp":
                arrow("up", keyboardDelegate.getKeyAbove);
                break;
              case "ArrowLeft":
                arrow("left", keyboardDelegate.getKeyLeftOf);
                break;
              case "ArrowRight":
                arrow("right", keyboardDelegate.getKeyRightOf);
                break;
              case "Home":
                if (keyboardDelegate.getFirstKey) {
                  state.setTarget(nextValidTarget(null, types, allowed, getNextTarget));
                }
                break;
              case "End":
                if (keyboardDelegate.getLastKey) {
                  state.setTarget(nextValidTarget(null, types, allowed, getPreviousTarget));
                }
                break;
              case "PageDown":
                if (keyboardDelegate.getKeyPageBelow) {
                  state.setTarget(pageTarget("down", types, allowed) ?? state.target.value);
                }
                break;
              case "PageUp":
                if (keyboardDelegate.getKeyPageAbove) {
                  state.setTarget(pageTarget("up", types, allowed) ?? state.target.value);
                }
                break;
            }

            options.onKeyDown?.(event);
          },
          // The collection settles focus itself in `updateFocusAfterDrop`.
          preventFocusOnDrop: true,
        }),
      );
    },
    {immediate: true},
  );

  return {
    attrs: computed(() => ({
      // Dropping on the collection as a whole is described by its root drop indicator, so
      // repeating the description here would announce it twice.
      "aria-describedby": undefined,
      id,
    })),
    handlers: drop.handlers,
  };
};
