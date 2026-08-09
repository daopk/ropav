import type {FocusResponder} from "@/composables/focus-responder";

import {renderVapor} from "@heroui/testing/helpers/vue";
import {describe, expect, it} from "vitest";
import {computed, nextTick} from "vue";

import {composeFocusResponder} from "@/composables/focus-responder";

import ResponderHost from "../fixtures/responder-host.vue";

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

const responderOf = (record: (name: string) => void): FocusResponder => ({
  attrs: computed(() => ({"aria-describedby": "description"})),
  handlers: computed(() => ({
    onBlur: () => record("above:blur"),
    onFocus: () => record("above:focus"),
    onKeydown: () => record("above:keydown"),
    onPointerdown: () => record("above:pointerdown"),
    onPointerenter: () => record("above:pointerenter"),
    onPointerleave: () => record("above:pointerleave"),
  })),
  registerElement: () => record("above:register"),
});

describe("composeFocusResponder", () => {
  it("runs the responder's listener before the element's own", () => {
    const events: string[] = [];
    const record = (name: string) => events.push(name);
    const focus = composeFocusResponder(responderOf(record), {
      onFocus: () => record("own:focus"),
      onPointerenter: () => record("own:pointerenter"),
    });

    focus.onPointerenter(new PointerEvent("pointerenter", POINTER));
    focus.onFocus(new FocusEvent("focus"));

    // Matching React's `mergeProps(contextProps, props)`: what was handed down goes first, so the
    // element can still see and act on the same event afterwards.
    expect(events).toEqual(["above:pointerenter", "own:pointerenter", "above:focus", "own:focus"]);
  });

  it("runs the element's own listener when nothing is above it", () => {
    const events: string[] = [];
    const focus = composeFocusResponder(null, {onBlur: () => events.push("own:blur")});

    focus.onBlur(new FocusEvent("blur"));

    expect(events).toEqual(["own:blur"]);
  });

  it("covers every listener a focusable needs, with or without a responder", () => {
    const events: string[] = [];
    const record = (name: string) => events.push(name);
    const focus = composeFocusResponder(responderOf(record));

    focus.onBlur(new FocusEvent("blur"));
    focus.onFocus(new FocusEvent("focus"));
    focus.onKeydown(new KeyboardEvent("keydown", {key: "Escape"}));
    focus.onPointerdown(new PointerEvent("pointerdown", POINTER));
    focus.onPointerenter(new PointerEvent("pointerenter", POINTER));
    focus.onPointerleave(new PointerEvent("pointerleave", POINTER));

    expect(events).toEqual([
      "above:blur",
      "above:focus",
      "above:keydown",
      "above:pointerdown",
      "above:pointerenter",
      "above:pointerleave",
    ]);

    // Nothing above, and nothing of its own: every listener still has to be safe to attach.
    const bare = composeFocusResponder(null);

    expect(() => bare.onKeydown(new KeyboardEvent("keydown"))).not.toThrow();
  });
});

describe("a button taking behaviour from above", () => {
  const render = (props: Record<string, unknown>) => renderVapor(ResponderHost, {props});

  const setup = (props: Record<string, unknown>) => {
    const events: string[] = [];
    const result = render({...props, record: (name: string) => events.push(name)});
    const button = result.getByRole("button", {name: "Press me"});

    return {button, events, result};
  };

  it("takes hover and focus from above", () => {
    const {button, events, result} = setup({withFocus: true});

    button.dispatchEvent(new PointerEvent("pointerenter", POINTER));
    button.dispatchEvent(new FocusEvent("focus"));
    button.dispatchEvent(new FocusEvent("blur"));
    button.dispatchEvent(new PointerEvent("pointerleave", POINTER));

    expect(events).toEqual([
      "focus:pointerenter",
      "focus:focus",
      "focus:blur",
      "focus:pointerleave",
    ]);
    expect(button.getAttribute("aria-describedby")).toBe("focus-description");

    result.unmount();
  });

  it("keeps its own hover state while something above watches it", async () => {
    const {button, result} = setup({withFocus: true});

    button.dispatchEvent(new PointerEvent("pointerenter", POINTER));
    await nextTick();

    // The responder is an observer, not a replacement: the button still paints its own states.
    expect(button.getAttribute("data-hovered")).toBe("true");

    result.unmount();
  });

  it("takes a press and a hover from above at the same time", () => {
    const {button, events, result} = setup({withFocus: true, withPress: true});

    button.dispatchEvent(new PointerEvent("pointerenter", POINTER));
    button.dispatchEvent(new PointerEvent("pointerdown", POINTER));
    button.dispatchEvent(new KeyboardEvent("keydown", {bubbles: true, key: "Escape"}));

    // Two separate channels, so a tooltip wrapped around a dropdown's trigger watches the button
    // without taking the press that makes it a trigger.
    expect(events).toEqual([
      "press:pointerenter",
      "focus:pointerenter",
      "press:pointerdown",
      "focus:pointerdown",
      "press:keydown",
      "focus:keydown",
    ]);

    result.unmount();
  });

  it("renders the attributes from both channels", () => {
    const {button, result} = setup({withFocus: true, withPress: true});

    expect(button.getAttribute("aria-describedby")).toBe("focus-description");
    expect(button.getAttribute("id")).toBe("press-id");
    expect(button.getAttribute("aria-expanded")).toBe("false");

    result.unmount();
  });

  it("leaves a button with nothing above it alone", async () => {
    const {button, events, result} = setup({});

    button.dispatchEvent(new PointerEvent("pointerenter", POINTER));
    button.dispatchEvent(new FocusEvent("focus"));
    await nextTick();

    expect(events).toEqual([]);
    expect(button.hasAttribute("aria-describedby")).toBe(false);
    expect(button.getAttribute("data-hovered")).toBe("true");

    result.unmount();
  });
});
