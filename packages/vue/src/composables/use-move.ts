import type {PointerType} from "./use-press";

import {onScopeDispose} from "vue";

/** The modifier state every move event carries over from the event that produced it. */
interface ModifierKeys {
  shiftKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
  altKey: boolean;
}

export interface MoveStartEvent extends ModifierKeys {
  type: "movestart";
  pointerType: PointerType;
}

export interface MoveMoveEvent extends ModifierKeys {
  type: "move";
  pointerType: PointerType;
  /** Movement along the x axis since the last event, in pixels. */
  deltaX: number;
  /** Movement along the y axis since the last event, in pixels. */
  deltaY: number;
}

export interface MoveEndEvent extends ModifierKeys {
  type: "moveend";
  pointerType: PointerType;
}

export interface UseMoveOptions {
  onMoveStart?: (event: MoveStartEvent) => void;
  onMove?: (event: MoveMoveEvent) => void;
  onMoveEnd?: (event: MoveEndEvent) => void;
}

export interface UseMoveHandlers {
  onKeydown: (event: KeyboardEvent) => void;
  onPointerdown: (event: PointerEvent) => void;
}

export interface UseMoveReturn {
  /**
   * The pointer and the keyboard entry points. Attach each one statically with `@event`, never
   * through `v-bind`: a vapor render re-attaches every `on*` key that arrived that way, which
   * drops the listener when the interaction itself is what re-rendered the element.
   */
  handlers: UseMoveHandlers;
}

/** How far one arrow press moves, before the consumer scales it by step or page size. */
const KEYBOARD_DELTA: Record<string, [deltaX: number, deltaY: number]> = {
  ArrowDown: [0, 1],
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  ArrowUp: [0, -1],
  Down: [0, 1],
  Left: [-1, 0],
  Right: [1, 0],
  Up: [0, -1],
};

/**
 * Drag and arrow-key movement, reported as a stream of deltas.
 *
 * Ported from React Aria's `useMove`. The consumer never sees coordinates, only how far the
 * pointer moved since the last event, which is what lets one handler serve a pointer drag and
 * an arrow press alike — an arrow press is reported as a single move of one unit, with
 * `pointerType: "keyboard"` so the consumer can scale it by whatever a step means to it.
 *
 * Deltas come from `pageX`/`pageY` rather than `movementX`/`movementY`: the latter is always
 * `0` in Safari on macOS, and Chrome on Android scales it by the device pixel ratio.
 *
 * Only the `PointerEvent` path is ported. React Aria carries a mouse/touch fallback for
 * environments without pointer events, which every browser this targets — and jsdom — has.
 *
 * @example
 * ```ts
 * const {handlers} = useMove({
 *   onMove: ({deltaX}) => { offset.value += deltaX; },
 * });
 * // <div @keydown="handlers.onKeydown" @pointerdown="handlers.onPointerdown" />
 * ```
 */
export const useMove = (options: UseMoveOptions): UseMoveReturn => {
  const {onMove, onMoveEnd, onMoveStart} = options;

  let didMove = false;
  let lastPosition: {pageX: number; pageY: number} | null = null;
  let pointerId: number | null = null;
  let detachGlobalListeners: (() => void) | undefined;

  const start = () => {
    didMove = false;
  };

  const move = (event: ModifierKeys, pointerType: PointerType, deltaX: number, deltaY: number) => {
    if (deltaX === 0 && deltaY === 0) return;

    const modifiers = {
      altKey: event.altKey,
      ctrlKey: event.ctrlKey,
      metaKey: event.metaKey,
      shiftKey: event.shiftKey,
    };

    // The first actual movement is what opens the interaction, not the press that preceded
    // it — a press that never moves is a click, and must not read as a drag.
    if (!didMove) {
      didMove = true;
      onMoveStart?.({...modifiers, pointerType, type: "movestart"});
    }

    onMove?.({...modifiers, deltaX, deltaY, pointerType, type: "move"});
  };

  const end = (event: ModifierKeys, pointerType: PointerType) => {
    if (!didMove) return;

    onMoveEnd?.({
      altKey: event.altKey,
      ctrlKey: event.ctrlKey,
      metaKey: event.metaKey,
      pointerType,
      shiftKey: event.shiftKey,
      type: "moveend",
    });
  };

  const onPointermove = (event: PointerEvent) => {
    if (event.pointerId !== pointerId) return;

    const pointerType = (event.pointerType || "mouse") as PointerType;

    move(
      event,
      pointerType,
      event.pageX - (lastPosition?.pageX ?? 0),
      event.pageY - (lastPosition?.pageY ?? 0),
    );
    lastPosition = {pageX: event.pageX, pageY: event.pageY};
  };

  const onPointerup = (event: PointerEvent) => {
    if (event.pointerId !== pointerId) return;

    end(event, (event.pointerType || "mouse") as PointerType);
    pointerId = null;
    detachGlobalListeners?.();
  };

  const onPointerdown = (event: PointerEvent) => {
    // Only the primary button drags, and a second pointer must not hijack a drag already
    // under way.
    if (event.button !== 0 || pointerId !== null) return;

    start();
    event.stopPropagation();
    event.preventDefault();
    lastPosition = {pageX: event.pageX, pageY: event.pageY};
    pointerId = event.pointerId;

    // On the window rather than the element: a drag keeps going once the pointer leaves the
    // element it started on, and only ends where it is released.
    window.addEventListener("pointermove", onPointermove, false);
    window.addEventListener("pointerup", onPointerup, false);
    window.addEventListener("pointercancel", onPointerup, false);

    detachGlobalListeners = () => {
      window.removeEventListener("pointermove", onPointermove, false);
      window.removeEventListener("pointerup", onPointerup, false);
      window.removeEventListener("pointercancel", onPointerup, false);
      detachGlobalListeners = undefined;
    };
  };

  const onKeydown = (event: KeyboardEvent) => {
    const delta = KEYBOARD_DELTA[event.key];

    if (!delta) return;

    // The element carrying this may hold a native control that would act on the same key —
    // a range input steps itself on the arrows — so the key is consumed here instead.
    event.preventDefault();
    event.stopPropagation();

    start();
    move(event, "keyboard", delta[0], delta[1]);
    end(event, "keyboard");
  };

  onScopeDispose(() => {
    detachGlobalListeners?.();
    pointerId = null;
  }, true);

  return {handlers: {onKeydown, onPointerdown}};
};
