import type { PressResponder } from "@/composables/press-responder";
import type { UsePressHandlers } from "@/composables/use-press";

import { describe, expect, it } from "vitest";
import { computed, shallowRef } from "vue";

import { composePressResponder } from "@/composables/press-responder";

const POINTER = {
  bubbles: true,
  button: 0,
  composed: true,
  height: 1,
  isPrimary: true,
  pointerId: 1,
  pointerType: "mouse",
  width: 1,
} as const;

const handlersOf = (record: (name: string) => void): UsePressHandlers => ({
  onClick: () => record("above:click"),
  onDragstart: () => record("above:dragstart"),
  onKeydown: () => record("above:keydown"),
  onMousedown: () => record("above:mousedown"),
  onPointerdown: () => record("above:pointerdown"),
  onPointerenter: () => record("above:pointerenter"),
  onPointerleave: () => record("above:pointerleave"),
  onPointerup: () => record("above:pointerup"),
});

const responderOf = (record: (name: string) => void): PressResponder => ({
  attrs: computed(() => ({ "aria-expanded": "false" })),
  handlers: computed(() => handlersOf(record)),
  isPressed: computed(() => false),
  registerElement: () => record("above:register"),
});

describe("composePressResponder", () => {
  it("runs the responder's listener before the element's own", () => {
    const events: string[] = [];
    const record = (name: string) => events.push(name);
    const press = composePressResponder(responderOf(record), {
      onClick: () => record("own:click"),
      onPointerdown: () => record("own:pointerdown"),
    });

    press.onPointerdown(new PointerEvent("pointerdown", POINTER));
    press.onClick(new MouseEvent("click", { bubbles: true }));

    // Matching React's `mergeProps(contextProps, props)`: what was handed down goes first, so the
    // element can still see and act on the same event afterwards.
    expect(events).toEqual(["above:pointerdown", "own:pointerdown", "above:click", "own:click"]);
  });

  it("runs the element's own listener when nothing is above it", () => {
    const events: string[] = [];
    const press = composePressResponder(null, { onClick: () => events.push("own:click") });

    press.onClick(new MouseEvent("click"));

    expect(events).toEqual(["own:click"]);
  });

  it("covers every listener a pressable needs, with or without a responder", () => {
    const events: string[] = [];
    const record = (name: string) => events.push(name);
    const press = composePressResponder(responderOf(record));

    press.onClick(new MouseEvent("click"));
    press.onDragstart(new DragEvent("dragstart"));
    press.onKeydown(new KeyboardEvent("keydown", { key: "Enter" }));
    press.onMousedown(new MouseEvent("mousedown"));
    press.onPointerdown(new PointerEvent("pointerdown", POINTER));
    press.onPointerenter(new PointerEvent("pointerenter", POINTER));
    press.onPointerleave(new PointerEvent("pointerleave", POINTER));
    press.onPointerup(new PointerEvent("pointerup", POINTER));

    expect(events).toEqual([
      "above:click",
      "above:dragstart",
      "above:keydown",
      "above:mousedown",
      "above:pointerdown",
      "above:pointerenter",
      "above:pointerleave",
      "above:pointerup",
    ]);

    // Nothing above, and nothing of its own: every listener still has to be safe to attach.
    const bare = composePressResponder(null);

    expect(() => bare.onPointerup(new PointerEvent("pointerup", POINTER))).not.toThrow();
  });

  /*
   * The reason these are wrappers rather than the responder's own functions handed through. They
   * are attached once with `@event` and read the responder when the event arrives, so a responder
   * that swaps its listeners is followed without reattaching anything — and nothing has to travel
   * through `v-bind`, where a vapor render would reorder it behind the element's own listener and
   * could drop one mid-dispatch.
   */
  it("reads the responder's listeners when the event arrives, not when composed", () => {
    const events: string[] = [];
    const which = shallowRef("first");
    const responder: PressResponder = {
      attrs: computed(() => ({})),
      handlers: computed(() => handlersOf((name) => events.push(`${which.value}:${name}`))),
      isPressed: computed(() => false),
      registerElement: () => {},
    };
    const press = composePressResponder(responder);

    press.onClick(new MouseEvent("click"));

    which.value = "second";

    press.onClick(new MouseEvent("click"));

    expect(events).toEqual(["first:above:click", "second:above:click"]);
  });

  it("hands the element's own listener the same event object", () => {
    const seen: Event[] = [];
    const press = composePressResponder(
      {
        attrs: computed(() => ({})),
        handlers: computed(() => ({ ...handlersOf(() => {}), onClick: (e) => seen.push(e) })),
        isPressed: computed(() => false),
        registerElement: () => {},
      },
      { onClick: (e) => seen.push(e) },
    );
    const event = new MouseEvent("click");

    press.onClick(event);

    expect(seen).toEqual([event, event]);
  });
});
