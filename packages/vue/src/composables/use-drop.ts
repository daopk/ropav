import type {DropOperationMask} from "../utils/dnd-constants";
import type {
  DragTypes,
  DropActivateEvent,
  DropEnterEvent,
  DropEvent,
  DropExitEvent,
  DropMoveEvent,
  DropOperation,
} from "../utils/dnd-types";
import type {ComputedRef, MaybeRefOrGetter, ShallowRef} from "vue";

import {computed, shallowRef, toValue, watch} from "vue";

import {
  DROP_EFFECT_TO_DROP_OPERATION,
  DROP_OPERATION,
  DROP_OPERATION_ALLOWED,
  DROP_OPERATION_TO_DROP_EFFECT,
} from "../utils/dnd-constants";
import {
  DataTransferDragTypes,
  dragTypesFromSet,
  readFromDataTransfer,
} from "../utils/dnd-data-transfer";
import {
  globalAllowedDropOperations,
  globalDndState,
  setGlobalDnDState,
  setGlobalDropEffect,
} from "../utils/dnd-state";
import {isIPad, isMac} from "../utils/platform";

import {registerDropTarget} from "./drag-manager";
import {useVirtualDrop} from "./use-virtual-drop";

/** How long the pointer must rest on a target before it is activated (e.g. a folder opens). */
const DROP_ACTIVATE_TIMEOUT = 800;

export interface UseDropOptions {
  /** The drop target element. */
  ref: ShallowRef<HTMLElement | null>;
  /** Which operation this target would perform for the drag in flight. */
  getDropOperation?: (types: DragTypes, allowedOperations: DropOperation[]) => DropOperation;
  /** As above, but resolved per pointer position — for a collection with per-item targets. */
  getDropOperationForPoint?: (
    types: DragTypes,
    allowedOperations: DropOperation[],
    x: number,
    y: number,
  ) => DropOperation;
  onDropEnter?: (event: DropEnterEvent) => void;
  onDropMove?: (event: DropMoveEvent) => void;
  onDropActivate?: (event: DropActivateEvent) => void;
  onDropExit?: (event: DropExitEvent) => void;
  onDrop?: (event: DropEvent) => void;
  /** Whether a separate focusable control receives the accessible drop instead of this element. */
  hasDropButton?: MaybeRefOrGetter<boolean | undefined>;
  isDisabled?: MaybeRefOrGetter<boolean | undefined>;
}

/** Listeners for the drop target. Never spread these through `v-bind` — see `useDrag`. */
export interface UseDropHandlers {
  onDragenter: (event: DragEvent) => void;
  onDragover: (event: DragEvent) => void;
  onDragleave: (event: DragEvent) => void;
  onDrop: (event: DragEvent) => void;
  onClick: () => void;
}

export interface UseDropReturn {
  attrs: ComputedRef<{"aria-describedby"?: string}>;
  handlers: UseDropHandlers;
  dropButtonAttrs: ComputedRef<{"aria-describedby"?: string}>;
  isDropTarget: ComputedRef<boolean>;
}

/**
 * Which operations the drag permits, narrowed by any modifier key being held.
 *
 * Ported from React Aria's `getAllowedOperations`.
 */
const getAllowedOperations = (event: DragEvent): DropOperationMask => {
  const effectAllowed = event.dataTransfer?.effectAllowed ?? "uninitialized";
  let allowed =
    DROP_OPERATION_ALLOWED[effectAllowed as keyof typeof DROP_OPERATION_ALLOWED] ??
    DROP_OPERATION.all;

  // WebKit reports "copyMove" on macOS and "all" on iOS whatever was set at `dragstart`, and
  // Chrome on Android always reports "copyMove". When the drag began in this page the real
  // answer was recorded globally, so intersect with that.
  // See https://bugs.webkit.org/show_bug.cgi?id=178058
  if (globalAllowedDropOperations) allowed &= globalAllowedDropOperations;

  // Chrome and Safari on macOS filter `effectAllowed` themselves when a modifier is held;
  // Firefox on macOS and every Windows browser do not, so it is done here. The key for each
  // operation is platform specific.
  let allowedModifiers: DropOperationMask = DROP_OPERATION.none;

  if (isMac()) {
    if (event.altKey) allowedModifiers |= DROP_OPERATION.copy;
    // iPadOS does not support link and will not fire `drop` at all if the effect is set to it.
    // See https://bugs.webkit.org/show_bug.cgi?id=244701
    if (event.ctrlKey && !isIPad()) allowedModifiers |= DROP_OPERATION.link;
    if (event.metaKey) allowedModifiers |= DROP_OPERATION.move;
  } else {
    if (event.altKey) allowedModifiers |= DROP_OPERATION.link;
    if (event.shiftKey) allowedModifiers |= DROP_OPERATION.move;
    if (event.ctrlKey) allowedModifiers |= DROP_OPERATION.copy;
  }

  return allowedModifiers ? allowed & allowedModifiers : allowed;
};

const allowedOperationsToArray = (mask: DropOperationMask): DropOperation[] => {
  const operations: DropOperation[] = [];

  if (mask & DROP_OPERATION.move) operations.push("move");
  if (mask & DROP_OPERATION.copy) operations.push("copy");
  if (mask & DROP_OPERATION.link) operations.push("link");

  return operations;
};

const resolveDropOperation = (
  allowed: DropOperationMask,
  operation: DropOperation,
): DropOperation => (allowed & DROP_OPERATION[operation] ? operation : "cancel");

/**
 * Drop behaviour for an element, ported from React Aria's `useDrop`.
 *
 * Handles the native drag events for a pointer, and registers with the drag session in
 * `drag-manager.ts` so the same target is reachable by keyboard and screen reader.
 *
 * As with `useDrag`, `attrs` and `handlers` are separate because Vapor re-attaches any `on*` key
 * that arrives via `v-bind` on every render (§3.4). Bind `attrs`; wire `handlers` with `@event`.
 */
export const useDrop = (options: UseDropOptions): UseDropReturn => {
  const isDropTarget = shallowRef(false);
  const isDisabled = () => Boolean(toValue(options.isDisabled));
  const hasDropButton = () => Boolean(toValue(options.hasDropButton));

  let x = 0;
  let y = 0;
  let dropEffect: DataTransfer["dropEffect"] = "none";
  let allowedOperations: DropOperationMask = DROP_OPERATION.all;
  let dropActivateTimer: ReturnType<typeof setTimeout> | undefined;

  /**
   * Every element under the pointer that has fired `dragenter` without a matching `dragleave`.
   *
   * `relatedTarget` would answer "is the pointer still inside" directly, but WebKit always
   * reports it as null, so entries are counted instead and the target is left when the set
   * empties.
   *
   * @see https://bugs.webkit.org/show_bug.cgi?id=66547
   */
  const dragOverElements = new Set<Element>();

  const rectOf = (event: DragEvent) => (event.currentTarget as HTMLElement).getBoundingClientRect();

  const fireDropEnter = (event: DragEvent) => {
    isDropTarget.value = true;

    if (!options.onDropEnter) return;

    const rect = rectOf(event);

    options.onDropEnter({type: "dropenter", x: event.clientX - rect.x, y: event.clientY - rect.y});
  };

  const fireDropExit = (event: DragEvent) => {
    isDropTarget.value = false;

    if (!options.onDropExit) return;

    const rect = rectOf(event);

    options.onDropExit({type: "dropexit", x: event.clientX - rect.x, y: event.clientY - rect.y});
  };

  const typesOf = (event: DragEvent): DragTypes =>
    new DataTransferDragTypes(event.dataTransfer ?? new DataTransfer());

  const onDragenter = (event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();

    if (event.target instanceof Element) dragOverElements.add(event.target);
    // Entering a child of a target already entered is not a new entry.
    if (dragOverElements.size > 1) return;

    const allowedBits = getAllowedOperations(event);
    const allowedArray = allowedOperationsToArray(allowedBits);
    let operation: DropOperation = allowedArray[0] ?? "cancel";

    if (options.getDropOperation) {
      operation = resolveDropOperation(
        allowedBits,
        options.getDropOperation(typesOf(event), allowedArray),
      );
    }

    if (options.getDropOperationForPoint) {
      const rect = rectOf(event);

      operation = resolveDropOperation(
        allowedBits,
        options.getDropOperationForPoint(
          typesOf(event),
          allowedArray,
          event.clientX - rect.x,
          event.clientY - rect.y,
        ),
      );
    }

    x = event.clientX;
    y = event.clientY;
    allowedOperations = allowedBits;
    dropEffect = DROP_OPERATION_TO_DROP_EFFECT[operation] ?? "none";

    if (event.dataTransfer) event.dataTransfer.dropEffect = dropEffect;

    if (operation !== "cancel") fireDropEnter(event);
  };

  const onDragover = (event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();

    const allowedBits = getAllowedOperations(event);

    // `dragover` fires continuously; nothing has changed unless the pointer or a modifier did.
    if (event.clientX === x && event.clientY === y && allowedBits === allowedOperations) {
      if (event.dataTransfer) event.dataTransfer.dropEffect = dropEffect;

      return;
    }

    x = event.clientX;
    y = event.clientY;

    const previousDropEffect = dropEffect;

    if (allowedBits !== allowedOperations) {
      const allowedArray = allowedOperationsToArray(allowedBits);
      let operation: DropOperation = allowedArray[0] ?? "cancel";

      if (options.getDropOperation) {
        operation = resolveDropOperation(
          allowedBits,
          options.getDropOperation(typesOf(event), allowedArray),
        );
      }

      dropEffect = DROP_OPERATION_TO_DROP_EFFECT[operation] ?? "none";
    }

    if (options.getDropOperationForPoint) {
      const rect = rectOf(event);
      const operation = resolveDropOperation(
        allowedBits,
        options.getDropOperationForPoint(
          typesOf(event),
          allowedOperationsToArray(allowedBits),
          x - rect.x,
          y - rect.y,
        ),
      );

      dropEffect = DROP_OPERATION_TO_DROP_EFFECT[operation] ?? "none";
    }

    allowedOperations = allowedBits;
    if (event.dataTransfer) event.dataTransfer.dropEffect = dropEffect;

    // The target becomes valid or stops being valid as the pointer moves across it.
    if (dropEffect === "none" && previousDropEffect !== "none") {
      fireDropExit(event);
    } else if (dropEffect !== "none" && previousDropEffect === "none") {
      fireDropEnter(event);
    }

    if (options.onDropMove && dropEffect !== "none") {
      const rect = rectOf(event);

      options.onDropMove({type: "dropmove", x: x - rect.x, y: y - rect.y});
    }

    clearTimeout(dropActivateTimer);

    if (options.onDropActivate && dropEffect !== "none") {
      const onDropActivate = options.onDropActivate;
      const rect = rectOf(event);

      dropActivateTimer = setTimeout(() => {
        onDropActivate({type: "dropactivate", x: x - rect.x, y: y - rect.y});
      }, DROP_ACTIVATE_TIMEOUT);
    }
  };

  const onDragleave = (event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();

    const target = event.target;

    if (target instanceof Element) dragOverElements.delete(target);

    // A drop indicator that disappears when the target changes never fires its `dragleave`, so
    // stale entries are swept when leaving the target itself.
    if (target === event.currentTarget) {
      for (const element of dragOverElements) {
        if (!(event.currentTarget as HTMLElement).contains(element)) {
          dragOverElements.delete(element);
        }
      }
    }

    if (dragOverElements.size > 0) return;

    if (dropEffect !== "none") fireDropExit(event);

    clearTimeout(dropActivateTimer);
  };

  const onDrop = (event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();

    // Chrome on Android reports "none" from `dragend`, so the real effect is recorded here for
    // the drag source to read back.
    // See https://bugs.chromium.org/p/chromium/issues/detail?id=1353951
    setGlobalDropEffect(dropEffect);

    if (options.onDrop && event.dataTransfer) {
      const rect = rectOf(event);

      options.onDrop({
        dropOperation: DROP_EFFECT_TO_DROP_OPERATION[dropEffect] ?? "cancel",
        items: readFromDataTransfer(event.dataTransfer),
        type: "drop",
        x: event.clientX - rect.x,
        y: event.clientY - rect.y,
      });
    }

    const snapshot = {...globalDndState};

    dragOverElements.clear();
    fireDropExit(event);
    clearTimeout(dropActivateTimer);

    // With no dragging collection recorded, a foreign drag was dropped here and there is no
    // `dragend` of ours that needs the effect. Otherwise the state has to survive `fireDropExit`,
    // which clears the drop collection, so that `dragend` can still tell an internal drop apart.
    if (snapshot.draggingCollectionRef == null) {
      setGlobalDropEffect(undefined);
    } else {
      setGlobalDnDState(snapshot);
    }
  };

  /**
   * Join the accessible drag session for as long as this target is enabled and mounted.
   *
   * Re-registers whenever the element or the disabled flag changes; the session recomputes its
   * valid targets on both register and unregister, so a target appearing mid-drag joins it.
   */
  watch(
    [() => options.ref.value, isDisabled],
    ([element, disabled], _previous, onCleanup) => {
      if (disabled || !element) return;

      onCleanup(
        registerDropTarget({
          element,
          // The session knows its types as a plain set; wrap it so wildcard and directory
          // matching answer the same here as they do on the pointer path.
          getDropOperation: (types, allowed) =>
            options.getDropOperation?.(dragTypesFromSet(types), allowed) ?? allowed[0] ?? "cancel",
          onDrop: (event) => options.onDrop?.(event),
          onDropActivate: (event) => options.onDropActivate?.(event),
          onDropEnter: (event) => {
            isDropTarget.value = true;
            options.onDropEnter?.(event);
          },
          onDropExit: (event) => {
            isDropTarget.value = false;
            options.onDropExit?.(event);
          },
        }),
      );
    },
    {immediate: true},
  );

  const virtual = useVirtualDrop();

  return {
    attrs: computed(() =>
      isDisabled() || hasDropButton()
        ? {}
        : {"aria-describedby": virtual.attrs.value["aria-describedby"]},
    ),
    dropButtonAttrs: computed(() =>
      isDisabled() || !hasDropButton()
        ? {}
        : {"aria-describedby": virtual.attrs.value["aria-describedby"]},
    ),
    handlers: {
      onClick: () => {
        if (isDisabled() || hasDropButton()) return;
        virtual.handlers.onClick();
      },
      onDragenter: (event) => {
        if (isDisabled()) return;
        onDragenter(event);
      },
      onDragleave: (event) => {
        if (isDisabled()) return;
        onDragleave(event);
      },
      onDragover: (event) => {
        if (isDisabled()) return;
        onDragover(event);
      },
      onDrop: (event) => {
        if (isDisabled()) return;
        onDrop(event);
      },
    },
    isDropTarget: computed(() => !isDisabled() && isDropTarget.value),
  };
};
