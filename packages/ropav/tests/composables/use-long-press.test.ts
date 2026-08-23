import type { LongPressEvent } from "@/composables/use-long-press";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { effectScope, nextTick } from "vue";

import { useLongPress } from "@/composables/use-long-press";

/** Run a composable in a disposable scope, mirroring a component lifetime. */
const withScope = <T>(setup: () => T): [T, () => void] => {
  const scope = effectScope();
  const result = scope.run(setup) as T;

  return [result, () => scope.stop()];
};

const setup = (options: Parameters<typeof useLongPress>[0] = {}) => {
  const element = document.createElement("button");

  document.body.appendChild(element);

  const events: string[] = [];
  const record = (type: string) => (event: LongPressEvent) => {
    events.push(`${type}:${event.pointerType}`);
  };

  const [longPress, dispose] = withScope(() =>
    useLongPress({
      onLongPress: record("longpress"),
      onLongPressEnd: record("longpressend"),
      onLongPressStart: record("longpressstart"),
      ...options,
    }),
  );

  element.addEventListener("pointerdown", (event) => longPress.handlers.onPointerdown(event));
  element.addEventListener("pointerup", (event) => longPress.handlers.onPointerup(event));
  element.addEventListener("click", (event) => longPress.handlers.onClick(event));

  return {
    dispose: () => {
      dispose();
      element.remove();
    },
    element,
    events,
    longPress,
  };
};

const pointer = (type: string, init: PointerEventInit = {}) =>
  new PointerEvent(type, {
    bubbles: true,
    button: 0,
    height: 1,
    isPrimary: true,
    pointerId: 1,
    pointerType: "mouse",
    width: 1,
    ...init,
  });

describe("useLongPress", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("reports the long press only once the threshold is met", () => {
    const { dispose, element, events } = setup();

    element.dispatchEvent(pointer("pointerdown"));

    expect(events).toEqual(["longpressstart:mouse"]);

    vi.advanceTimersByTime(499);

    expect(events).toEqual(["longpressstart:mouse"]);

    vi.advanceTimersByTime(1);

    // The end lands before the long press, and in that order deliberately: meeting the
    // threshold cancels the ordinary press first, which is what ends this one.
    expect(events).toEqual(["longpressstart:mouse", "longpressend:mouse", "longpress:mouse"]);

    dispose();
  });

  it("honours a custom threshold", () => {
    const { dispose, element, events } = setup({ threshold: 200 });

    element.dispatchEvent(pointer("pointerdown"));
    vi.advanceTimersByTime(200);

    expect(events).toEqual(["longpressstart:mouse", "longpressend:mouse", "longpress:mouse"]);

    dispose();
  });

  it("does not report a long press when the press is released early", () => {
    const { dispose, element, events } = setup();

    element.dispatchEvent(pointer("pointerdown"));
    vi.advanceTimersByTime(100);
    element.dispatchEvent(pointer("pointerup"));
    element.dispatchEvent(new MouseEvent("click", { bubbles: true, button: 0, detail: 1 }));
    vi.advanceTimersByTime(1000);

    expect(events).toEqual(["longpressstart:mouse", "longpressend:mouse"]);

    dispose();
  });

  it("cancels the ordinary press on the same element once the threshold is met", () => {
    const { dispose, element } = setup();
    const cancelled = vi.fn();

    element.addEventListener("pointercancel", cancelled);
    element.dispatchEvent(pointer("pointerdown"));
    vi.advanceTimersByTime(500);

    // Without this, lifting the finger after a long press would activate the element as well
    // as having opened whatever the long press opened.
    expect(cancelled).toHaveBeenCalledTimes(1);

    dispose();
  });

  it("blocks the click that follows a long press", () => {
    const { dispose, element } = setup();

    element.dispatchEvent(pointer("pointerdown"));
    vi.advanceTimersByTime(500);

    const click = new MouseEvent("click", {
      bubbles: true,
      button: 0,
      cancelable: true,
      detail: 1,
    });

    element.dispatchEvent(click);

    expect(click.defaultPrevented).toBe(true);

    dispose();
  });

  it("keeps the press event bubbling so the element still handles its own press", () => {
    const { dispose, element } = setup();
    const outer = document.createElement("div");

    element.parentElement!.appendChild(outer);
    outer.appendChild(element);

    const seen = vi.fn();

    outer.addEventListener("pointerdown", seen);
    element.dispatchEvent(pointer("pointerdown"));

    expect(seen).toHaveBeenCalledTimes(1);

    outer.remove();
    dispose();
  });

  it("ignores a pointer type it was not asked to watch", () => {
    const { dispose, element, events } = setup({ pointerType: "touch" });

    element.dispatchEvent(pointer("pointerdown", { pointerType: "mouse" }));
    vi.advanceTimersByTime(500);

    expect(events).toEqual([]);

    dispose();
  });

  it("ignores a keyboard press, which has no hold to measure", () => {
    const { dispose, element, events, longPress } = setup();

    element.addEventListener("keydown", (event) => longPress.handlers.onKeydown(event));
    element.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Enter" }));
    vi.advanceTimersByTime(500);

    expect(events).toEqual([]);

    dispose();
  });

  it("exposes a description so the gesture is discoverable", async () => {
    const { dispose, longPress } = setup({ accessibilityDescription: "Long press to open menu" });

    await nextTick();

    const id = longPress.describedBy.value!;

    expect(id).toBeTruthy();
    expect(document.getElementById(id)).toHaveTextContent("Long press to open menu");
    // Hidden rather than visually hidden: nothing about it should affect layout.
    expect(document.getElementById(id)!.style.display).toBe("none");

    dispose();
  });

  it("removes the description node when the last consumer goes away", () => {
    const { dispose, longPress } = setup({ accessibilityDescription: "Long press to open menu" });
    const id = longPress.describedBy.value!;

    dispose();

    expect(document.getElementById(id)).toBeNull();
  });

  it("shares one description node between consumers of the same text", () => {
    const first = setup({ accessibilityDescription: "Long press to open menu" });
    const second = setup({ accessibilityDescription: "Long press to open menu" });

    expect(second.longPress.describedBy.value).toBe(first.longPress.describedBy.value);

    const id = first.longPress.describedBy.value!;

    first.dispose();

    // Still referenced, so it must survive.
    expect(document.getElementById(id)).not.toBeNull();

    second.dispose();

    expect(document.getElementById(id)).toBeNull();
  });

  it("exposes no description while disabled", () => {
    const { dispose, longPress } = setup({
      accessibilityDescription: "Long press to open menu",
      isDisabled: true,
    });

    expect(longPress.describedBy.value).toBeUndefined();

    dispose();
  });
});
