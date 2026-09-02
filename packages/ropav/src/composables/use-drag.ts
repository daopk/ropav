import type { DropOperationMask } from "../utils/dnd-constants";
import type {
  DragEndEvent,
  DragItem,
  DragMoveEvent,
  DragPreviewRenderer,
  DragStartEvent,
  DropOperation,
} from "../utils/dnd-types";
import type { PressEvent } from "./use-press";
import type { ComputedRef, MaybeRefOrGetter, ShallowRef } from "vue";

import { computed, onScopeDispose, shallowRef, toValue } from "vue";

import { dndStrings } from "../i18n/dnd";
import {
  DROP_EFFECT_TO_DROP_OPERATION,
  DROP_OPERATION,
  EFFECT_ALLOWED,
} from "../utils/dnd-constants";
import { writeToDataTransfer } from "../utils/dnd-data-transfer";
import {
  globalDropEffect,
  setGlobalAllowedDropOperations,
  setGlobalDropEffect,
} from "../utils/dnd-state";
import { isIOS, isWebKit } from "../utils/platform";

import { beginDragging } from "./drag-manager";
import { useDragModality } from "./drag-modality";
import { useDescription } from "./use-description";
import { useLocalizedStringFormatter } from "./use-localized-string-formatter";
import { isVirtualClick, isVirtualPointerEvent } from "./use-press";

export interface UseDragOptions {
  /** The items being dragged, read when the drag starts. */
  getItems: () => DragItem[];
  onDragStart?: (event: DragStartEvent) => void;
  onDragMove?: (event: DragMoveEvent) => void;
  /** Called when the drag ends, whether it was dropped or cancelled. */
  onDragEnd?: (event: DragEndEvent) => void;
  /** Which operations the drop side may choose from. Defaults to all three. */
  getAllowedDropOperations?: () => DropOperation[];
  /** A custom drag image. Without one the browser drags a picture of the element itself. */
  preview?: ShallowRef<DragPreviewRenderer | null>;
  /**
   * Whether a separate focusable control starts the accessible drag.
   *
   * With one, the keyboard and screen reader handlers move off the draggable element and onto
   * that control — otherwise Enter on the element would mean both "activate me" and "drag me".
   */
  hasDragButton?: MaybeRefOrGetter<boolean | undefined>;
  isDisabled?: MaybeRefOrGetter<boolean | undefined>;
}

/** Listeners for the draggable element. Never spread these through `v-bind` — see below. */
export interface UseDragHandlers {
  onDragstart: (event: DragEvent) => void;
  onDrag: (event: DragEvent) => void;
  onDragend: (event: DragEvent) => void;
  onPointerdown?: (event: PointerEvent) => void;
  onKeydownCapture?: (event: KeyboardEvent) => void;
  onKeyupCapture?: (event: KeyboardEvent) => void;
  onClick?: (event: MouseEvent) => void;
}

/** Attributes for a draggable element. Attributes only, never listeners. */
export interface DragAttrs {
  draggable?: "true" | "false";
  "aria-describedby"?: string;
}

export interface UseDragReturn {
  attrs: ComputedRef<Required<Pick<DragAttrs, "draggable">> & DragAttrs>;
  handlers: UseDragHandlers;
  /** Attributes for the explicit drag control, when there is one. */
  dragButtonAttrs: ComputedRef<{ "aria-describedby": string | undefined }>;
  /** Hand this to a `PressResponder`, so the control stays an ordinary `Button`. */
  onDragButtonPress: (event: PressEvent) => void;
  isDragging: ComputedRef<boolean>;
}

/**
 * Drag behaviour for an element, ported from React Aria's `useDrag`.
 *
 * Covers three ways to start a drag, because the native one only serves a mouse: the HTML drag
 * events for a pointer, Enter for the keyboard, and a click with no pointer behind it for a
 * screen reader. The last two hand off to the drag session in `drag-manager.ts`.
 *
 * **`attrs` and `handlers` are separate, and that is load-bearing.** Vapor
 * removes and re-adds every `on*` key that arrives through `v-bind` on each render, so a listener
 * spread that way ends up behind the template's own and can be torn off mid-dispatch. A drag
 * re-renders the instant it starts — `data-dragging` flips — so this is certain to bite rather
 * than merely possible. Bind `attrs` with `v-bind`; attach `handlers` statically with `@event`.
 */
export const useDrag = (options: UseDragOptions): UseDragReturn => {
  const draggingElement = shallowRef<Element | null>(null);
  const isDragging = computed(() => draggingElement.value != null);
  const modality = useDragModality();

  /**
   * The modality read at `pointerdown`, kept until `dragstart`.
   *
   * A screen reader's pass-through gesture arrives as a real drag, and by then it is
   * indistinguishable from a mouse. The pointer event before it still carries the tell.
   */
  let modalityOnPointerDown: string | null = null;
  let lastX = 0;
  let lastY = 0;
  let releaseDropGuard: (() => void) | null = null;

  const stringFormatter = useLocalizedStringFormatter(dndStrings);

  /** How to start the drag, or — once it is running — how to cancel it. */
  const description = computed(() => {
    const keys = {
      keyboard: { end: "endDragKeyboard", start: "dragDescriptionKeyboard" },
      touch: { end: "endDragTouch", start: "dragDescriptionTouch" },
      virtual: { end: "endDragVirtual", start: "dragDescriptionVirtual" },
    } as const;
    const key = keys[modality.value];

    return stringFormatter.value.format(isDragging.value ? key.end : key.start);
  });
  const { describedBy } = useDescription(description);

  const allowedOperations = (): DropOperation[] =>
    options.getAllowedDropOperations?.() ?? ["move", "copy", "link"];

  /** Start the accessible drag — the keyboard and screen reader path. */
  const startDragging = (target: HTMLElement) => {
    const rect = target.getBoundingClientRect();

    options.onDragStart?.({
      type: "dragstart",
      x: rect.x + rect.width / 2,
      y: rect.y + rect.height / 2,
    });

    beginDragging(
      {
        allowedDropOperations: allowedOperations(),
        element: target,
        items: options.getItems(),
        onDragEnd(event) {
          draggingElement.value = null;
          options.onDragEnd?.(event);
        },
      },
      stringFormatter,
    );

    draggingElement.value = target;
  };

  const onDragstart = (event: DragEvent) => {
    if (event.defaultPrevented) return;

    // A nested draggable must not start a second drag of its own.
    event.stopPropagation();

    // A screen reader's pass-through gesture: refuse the native drag and run the accessible one.
    if (modalityOnPointerDown === "virtual") {
      event.preventDefault();
      startDragging(event.target as HTMLElement);
      modalityOnPointerDown = null;

      return;
    }

    options.onDragStart?.({ type: "dragstart", x: event.clientX, y: event.clientY });

    const items = options.getItems();

    // A real `dragstart` always carries one; a synthesized event in a test may not.
    if (!event.dataTransfer) return;

    // Some browsers seed the transfer with whatever text is selected on the page.
    event.dataTransfer.clearData?.();
    writeToDataTransfer(event.dataTransfer, items);

    let allowed: DropOperationMask = DROP_OPERATION.all;

    if (options.getAllowedDropOperations) {
      allowed = DROP_OPERATION.none;
      for (const operation of options.getAllowedDropOperations()) {
        allowed |= DROP_OPERATION[operation] || DROP_OPERATION.none;
      }
    }

    setGlobalAllowedDropOperations(allowed);
    event.dataTransfer.effectAllowed = EFFECT_ALLOWED[allowed] ?? "none";

    applyPreview(event, items);

    // A drag started here is only meaningful to a target built by `useDrop`, which is what
    // guarantees the keyboard alternative exists. Anything else must not silently accept it.
    const onStrayDrop = (dropEvent: Event) => {
      dropEvent.preventDefault();
      dropEvent.stopPropagation();
      // eslint-disable-next-line no-console
      console.warn(
        "Drags initiated from useDrag may only be dropped on a target created with useDrop. This ensures that a keyboard and screen reader accessible alternative is available.",
      );
    };

    window.addEventListener("drop", onStrayDrop, { once: true });
    releaseDropGuard = () => window.removeEventListener("drop", onStrayDrop);

    lastX = event.clientX;
    lastY = event.clientY;

    // Wait a frame before reporting the drag, so the browser has painted the preview from the
    // element as it looked before `data-dragging` restyled it.
    const target = event.target as Element | null;

    requestAnimationFrame(() => {
      draggingElement.value = target;
    });
  };

  /** Render the custom drag image, if the caller supplied one. */
  const applyPreview = (event: DragEvent, items: DragItem[]) => {
    const render = options.preview?.value;

    if (typeof render !== "function" || !event.dataTransfer) return;

    const dataTransfer = event.dataTransfer;
    const currentTarget = event.currentTarget as HTMLElement | null;

    render(items, (node, userX, userY) => {
      if (!node) return;

      const size = node.getBoundingClientRect();
      const rect = currentTarget?.getBoundingClientRect();
      let offsetX = rect ? event.clientX - rect.x : size.width / 2;
      let offsetY = rect ? event.clientY - rect.y : size.height / 2;

      // A preview much smaller than the element would otherwise hang off the pointer entirely.
      if (offsetX > size.width || offsetY > size.height) {
        offsetX = size.width / 2;
        offsetY = size.height / 2;
      }

      if (typeof userX === "number" && typeof userY === "number") {
        offsetX = userX;
        offsetY = userY;
      }

      // Browsers clamp out-of-range offsets themselves, but only after the first drag update,
      // which reads as a visible snap.
      offsetX = Math.max(0, Math.min(offsetX, size.width));
      offsetY = Math.max(0, Math.min(offsetY, size.height));

      // An odd height renders blurry on some displays.
      node.style.height = `${2 * Math.round(size.height / 2)}px`;

      dataTransfer.setDragImage(node, offsetX, offsetY);
    });
  };

  const onDrag = (event: DragEvent) => {
    event.stopPropagation();

    // The browser fires `drag` continuously, including while the pointer is still.
    if (event.clientX === lastX && event.clientY === lastY) return;

    options.onDragMove?.({ type: "dragmove", x: event.clientX, y: event.clientY });

    lastX = event.clientX;
    lastY = event.clientY;
  };

  const onDragend = (event: DragEvent) => {
    event.stopPropagation();

    if (options.onDragEnd) {
      const dropEffect = event.dataTransfer?.dropEffect ?? "none";

      options.onDragEnd({
        // Chrome on Android always reports "none" here, so the effect the drop target recorded
        // globally wins when there is one.
        // See https://bugs.chromium.org/p/chromium/issues/detail?id=1353951
        dropOperation: DROP_EFFECT_TO_DROP_OPERATION[globalDropEffect ?? dropEffect] ?? "cancel",

        type: "dragend",

        x: event.clientX,

        y: event.clientY,
      });
    }

    draggingElement.value = null;
    releaseDropGuard?.();
    releaseDropGuard = null;
    setGlobalAllowedDropOperations(DROP_OPERATION.none);
    setGlobalDropEffect(undefined);
  };

  /**
   * A drag whose element is removed by the drop never fires `dragend`.
   *
   * Reordering a list does exactly that, so without this the source would stay marked as
   * dragging forever.
   *
   * @see https://bugzilla.mozilla.org/show_bug.cgi?id=460801
   */
  onScopeDispose(() => {
    releaseDropGuard?.();

    const element = draggingElement.value;

    if (!element || element.isConnected) return;

    options.onDragEnd?.({
      dropOperation: DROP_EFFECT_TO_DROP_OPERATION[globalDropEffect ?? "none"] ?? "cancel",
      type: "dragend",
      x: 0,
      y: 0,
    });

    draggingElement.value = null;
    setGlobalAllowedDropOperations(DROP_OPERATION.none);
    setGlobalDropEffect(undefined);
  });

  const onDragButtonPress = (event: PressEvent) => {
    if (event.pointerType !== "keyboard" && event.pointerType !== "virtual") return;

    startDragging(event.target as HTMLElement);
  };

  /* -----------------------------------------------------------------------------------------
   * Handlers that only exist when the element itself starts the accessible drag
   * ---------------------------------------------------------------------------------------*/

  const onPointerdown = (event: PointerEvent) => {
    modalityOnPointerDown = isVirtualPointerEvent(event) ? "virtual" : event.pointerType;

    if (modalityOnPointerDown === "virtual") return;

    // iOS VoiceOver reports a zero-sized pointer.
    if (event.width < 1 && event.height < 1 && isIOS() && isWebKit()) {
      modalityOnPointerDown = "virtual";

      return;
    }

    // Android TalkBack lands the pointer exactly at the element's centre.
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const offsetX = event.clientX - rect.x;
    const offsetY = event.clientY - rect.y;

    if (Math.abs(offsetX - rect.width / 2) <= 0.5 && Math.abs(offsetY - rect.height / 2) <= 0.5) {
      modalityOnPointerDown = "virtual";
    }
  };

  // Capture phase, so selection or an item action never sees the Enter that starts a drag.
  const onKeydownCapture = (event: KeyboardEvent) => {
    if (event.target !== event.currentTarget || event.key !== "Enter") return;

    event.preventDefault();
    event.stopPropagation();
  };

  const onKeyupCapture = (event: KeyboardEvent) => {
    if (event.target !== event.currentTarget || event.key !== "Enter") return;

    event.preventDefault();
    event.stopPropagation();
    startDragging(event.target as HTMLElement);
  };

  const onClick = (event: MouseEvent) => {
    // NVDA and JAWS in browse mode, and touch screen readers, fire no key events at all.
    if (!isVirtualClick(event) && modalityOnPointerDown !== "virtual") return;

    event.preventDefault();
    event.stopPropagation();
    startDragging(event.target as HTMLElement);
  };

  const hasDragButton = () => Boolean(toValue(options.hasDragButton));
  const isDisabled = () => Boolean(toValue(options.isDisabled));

  return {
    attrs: computed(() => {
      if (isDisabled()) return { draggable: "false" as const };

      return {
        draggable: "true" as const,
        // With a drag button the description belongs on it, not here.
        ...(hasDragButton() ? {} : { "aria-describedby": describedBy.value }),
      };
    }),
    dragButtonAttrs: computed(() => ({ "aria-describedby": describedBy.value })),
    handlers: {
      // Present unconditionally so the listener set never changes shape mid-drag; each one
      // returns early when a drag button owns the accessible path.
      onClick: (event: MouseEvent) => {
        if (isDisabled() || hasDragButton()) return;
        onClick(event);
      },

      onDrag,

      onDragend,

      onDragstart,
      onKeydownCapture: (event: KeyboardEvent) => {
        if (isDisabled() || hasDragButton()) return;
        onKeydownCapture(event);
      },
      onKeyupCapture: (event: KeyboardEvent) => {
        if (isDisabled() || hasDragButton()) return;
        onKeyupCapture(event);
      },
      onPointerdown: (event: PointerEvent) => {
        if (isDisabled() || hasDragButton()) return;
        onPointerdown(event);
      },
    },
    isDragging: computed(() => !isDisabled() && isDragging.value),
    onDragButtonPress,
  };
};
