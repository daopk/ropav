import {renderVapor} from "@heroui/testing/helpers/vue";
import {describe, expect, it, vi} from "vitest";
import {nextTick, reactive} from "vue";

import {Button} from "@/components/button";

const renderButton = (props: Record<string, unknown> = {}) =>
  renderVapor(Button, {
    props,
    slots: {default: () => document.createTextNode("Press me")},
  });

const buttonIn = (container: HTMLElement) => container.querySelector("button");

describe("Button", () => {
  describe("structure", () => {
    it("renders a native button with its data-slot", () => {
      const {container, unmount} = renderButton();
      const button = buttonIn(container);

      expect(button).not.toBeNull();
      expect(button?.getAttribute("data-slot")).toBe("button");

      unmount();
    });

    it("renders slot content as its accessible name", () => {
      const {getByRole, unmount} = renderButton();

      expect(getByRole("button", {name: "Press me"})).toBeInTheDocument();

      unmount();
    });

    // Asserted on the IDL property rather than the content attribute: Vue compiles
    // `:type` on a <button> to a DOM property write, and skips it when the value already
    // equals `el.type` — which reads "submit" by default even with no attribute set.
    it("defaults to type button so it never submits a form by accident", () => {
      const {container, unmount} = renderButton();

      expect(buttonIn(container)?.type).toBe("button");

      unmount();
    });

    it("supports an explicit type", () => {
      const {container, unmount} = renderButton({type: "submit"});

      expect(buttonIn(container)?.type).toBe("submit");

      unmount();
    });

    it("forwards unknown attributes to the button", () => {
      const {container, unmount} = renderButton({"aria-label": "Save", "data-testid": "save"});
      const button = buttonIn(container);

      expect(button?.getAttribute("data-testid")).toBe("save");
      expect(button?.getAttribute("aria-label")).toBe("Save");

      unmount();
    });
  });

  describe("styling", () => {
    it("renders the BEM block class", () => {
      const {container, unmount} = renderButton();

      expect(buttonIn(container)?.classList.contains("button")).toBe(true);

      unmount();
    });

    it("applies the default size and variant modifiers", () => {
      const {container, unmount} = renderButton();
      const button = buttonIn(container);

      expect(button?.classList.contains("button--md")).toBe(true);
      expect(button?.classList.contains("button--primary")).toBe(true);

      unmount();
    });

    it.each([
      ["size", "lg", "button--lg"],
      ["variant", "danger", "button--danger"],
      ["isIconOnly", true, "button--icon-only"],
      ["fullWidth", true, "button--full-width"],
    ])("applies the %s modifier class", (prop, value, expected) => {
      const {container, unmount} = renderButton({[prop]: value});

      expect(buttonIn(container)?.classList.contains(expected)).toBe(true);

      unmount();
    });

    it("merges a caller class", () => {
      const {container, unmount} = renderButton({class: "shadow-lg"});
      const button = buttonIn(container);

      expect(button?.classList.contains("button")).toBe(true);
      expect(button?.classList.contains("shadow-lg")).toBe(true);

      unmount();
    });
  });

  describe("disabled", () => {
    it("sets the native disabled attribute", () => {
      const {container, unmount} = renderButton({isDisabled: true});

      expect(buttonIn(container)?.disabled).toBe(true);

      unmount();
    });

    it("omits the attribute when enabled, so CSS never sees a false value", () => {
      const {container, unmount} = renderButton();

      expect(buttonIn(container)?.hasAttribute("disabled")).toBe(false);

      unmount();
    });
  });

  describe("tab order", () => {
    // Written even though a native button is already tabbable: Safari does not focus one
    // unless an explicit tab index says so, which is why react-aria always sets it.
    it("renders an explicit tab index", () => {
      const {container, unmount} = renderButton();

      expect(buttonIn(container)).toHaveAttribute("tabindex", "0");

      unmount();
    });

    it("drops the tab index when disabled, so it is not reachable at all", () => {
      const {container, unmount} = renderButton({isDisabled: true});

      expect(buttonIn(container)?.hasAttribute("tabindex")).toBe(false);

      unmount();
    });

    // A pending button stays focusable rather than `disabled`, so it keeps its stop.
    it("keeps the tab index while pending", () => {
      const {container, unmount} = renderButton({isPending: true});

      expect(buttonIn(container)).toHaveAttribute("tabindex", "0");

      unmount();
    });
  });

  describe("pending", () => {
    it("exposes data-pending, which is what the CSS keys on", () => {
      const {container, unmount} = renderButton({isPending: true});

      expect(buttonIn(container)?.getAttribute("data-pending")).toBe("true");

      unmount();
    });

    it("omits data-pending when idle", () => {
      const {container, unmount} = renderButton();

      expect(buttonIn(container)?.hasAttribute("data-pending")).toBe(false);

      unmount();
    });

    it("stops being a submit button so a pending form cannot be submitted", () => {
      const {container, unmount} = renderButton({isPending: true, type: "submit"});

      expect(buttonIn(container)?.type).toBe("button");

      unmount();
    });

    it("keeps a non-submit type as it is", () => {
      const {container, unmount} = renderButton({isPending: true, type: "reset"});

      expect(buttonIn(container)?.type).toBe("reset");

      unmount();
    });

    it("marks itself aria-disabled while staying focusable", () => {
      const {container, unmount} = renderButton({isPending: true});
      const button = buttonIn(container);

      expect(button?.getAttribute("aria-disabled")).toBe("true");
      // Not `disabled`, so assistive technology can still reach and announce it.
      expect(button?.hasAttribute("disabled")).toBe(false);

      unmount();
    });
  });

  describe("interaction states", () => {
    const pointerEvent = (type: string, init: PointerEventInit = {}) =>
      new PointerEvent(type, {bubbles: true, button: 0, pointerType: "mouse", ...init});

    it("reports hover, which is what the stylesheet keys on", async () => {
      const {container, unmount} = renderButton();
      const button = buttonIn(container)!;

      button.dispatchEvent(pointerEvent("pointerenter"));
      await nextTick();

      expect(button.getAttribute("data-hovered")).toBe("true");

      button.dispatchEvent(pointerEvent("pointerleave"));
      await nextTick();

      expect(button.hasAttribute("data-hovered")).toBe(false);

      unmount();
    });

    it("reports press, and ends it when the pointer is released anywhere", async () => {
      const {container, unmount} = renderButton();
      const button = buttonIn(container)!;

      button.dispatchEvent(pointerEvent("pointerdown"));
      await nextTick();

      expect(button.getAttribute("data-pressed")).toBe("true");

      // Released off the button, the case native `:active` gets wrong.
      document.body.dispatchEvent(pointerEvent("pointerup"));
      await nextTick();

      expect(button.hasAttribute("data-pressed")).toBe(false);

      unmount();
    });

    it("reports focus, and marks it visible only after a keyboard interaction", async () => {
      const {container, unmount} = renderButton();
      const button = buttonIn(container)!;

      document.dispatchEvent(pointerEvent("pointerdown"));
      button.dispatchEvent(new FocusEvent("focus"));
      await nextTick();

      expect(button.getAttribute("data-focused")).toBe("true");
      expect(button.hasAttribute("data-focus-visible")).toBe(false);

      button.dispatchEvent(new FocusEvent("blur"));
      document.dispatchEvent(new KeyboardEvent("keydown", {key: "Tab"}));
      button.dispatchEvent(new FocusEvent("focus"));
      await nextTick();

      // `data-focus-visible` is the only selector that paints the focus ring.
      expect(button.getAttribute("data-focus-visible")).toBe("true");

      unmount();
    });

    it("reports no hover or press while disabled", async () => {
      const {container, unmount} = renderButton({isDisabled: true});
      const button = buttonIn(container)!;

      button.dispatchEvent(pointerEvent("pointerenter"));
      button.dispatchEvent(pointerEvent("pointerdown"));
      await nextTick();

      expect(button.hasAttribute("data-hovered")).toBe(false);
      expect(button.hasAttribute("data-pressed")).toBe(false);

      unmount();
    });

    it("reports no press while pending, which stays focusable", async () => {
      const {container, unmount} = renderButton({isPending: true});
      const button = buttonIn(container)!;

      button.dispatchEvent(pointerEvent("pointerdown"));
      button.dispatchEvent(new FocusEvent("focus"));
      await nextTick();

      expect(button.hasAttribute("data-pressed")).toBe(false);
      expect(button.getAttribute("data-focused")).toBe("true");

      unmount();
    });

    it("exposes data-disabled alongside the native attribute", () => {
      const {container, unmount} = renderButton({isDisabled: true});

      expect(buttonIn(container)?.getAttribute("data-disabled")).toBe("true");

      unmount();
    });

    it("still forwards a caller's own pointer listener", async () => {
      const onPointerenter = vi.fn();
      const {container, unmount} = renderVapor(Button, {
        props: {onPointerenter},
        slots: {default: () => document.createTextNode("Press me")},
      });
      const button = buttonIn(container)!;

      button.dispatchEvent(pointerEvent("pointerenter"));
      await nextTick();

      expect(onPointerenter).toHaveBeenCalledTimes(1);
      // The component's own handler must not be replaced by the caller's.
      expect(button.getAttribute("data-hovered")).toBe("true");

      unmount();
    });
  });

  describe("announcements", () => {
    const liveRegionText = () =>
      document.querySelector('[data-slot="live-announcer"]')?.textContent;

    it("announces the transition while focused", async () => {
      const props = reactive({isPending: false});
      const {container, unmount} = renderVapor(Button, {
        props,
        slots: {default: () => document.createTextNode("Press me")},
      });

      buttonIn(container)!.dispatchEvent(new FocusEvent("focus"));
      props.isPending = true;
      await nextTick();

      expect(liveRegionText()).toBe("pending");

      props.isPending = false;
      await nextTick();

      // Cleared, so a state that has ended stops being reported.
      expect(liveRegionText()).toBe("");

      unmount();
    });

    it("stays quiet when the button is not focused", async () => {
      const props = reactive({isPending: false});
      const {unmount} = renderVapor(Button, {
        props,
        slots: {default: () => document.createTextNode("Press me")},
      });

      props.isPending = true;
      await nextTick();

      expect(liveRegionText()).not.toBe("pending");

      unmount();
    });
  });

  describe("slot props", () => {
    it("hands its state to the default slot", async () => {
      const seen: Record<string, unknown>[] = [];
      const {container, unmount} = renderVapor(Button, {
        props: {isPending: true},
        slots: {
          default: (slotProps = {}) => {
            seen.push(slotProps);

            return document.createTextNode("Press me");
          },
        },
      });

      expect(seen.at(0)).toMatchObject({
        isDisabled: false,
        isFocusVisible: false,
        isHovered: false,
        isPending: true,
        isPressed: false,
      });

      buttonIn(container)!.dispatchEvent(
        new PointerEvent("pointerenter", {bubbles: true, pointerType: "mouse"}),
      );
      await nextTick();

      // Slot props are read live, so content can follow the state without a rerender.
      expect(seen.at(-1)).toMatchObject({isPending: true});

      unmount();
    });
  });

  describe("events", () => {
    it("emits click when activated", async () => {
      const onClick = vi.fn();
      const {getByRole, unmount} = renderVapor(Button, {
        props: {onClick},
        slots: {default: () => document.createTextNode("Press me")},
      });

      getByRole("button").click();

      expect(onClick).toHaveBeenCalledTimes(1);

      unmount();
    });

    it("does not emit click while pending", () => {
      const onClick = vi.fn();
      const {getByRole, unmount} = renderVapor(Button, {
        props: {isPending: true, onClick},
        slots: {default: () => document.createTextNode("Press me")},
      });

      getByRole("button").click();

      expect(onClick).not.toHaveBeenCalled();

      unmount();
    });

    it("does not emit click while disabled", () => {
      const onClick = vi.fn();
      const {getByRole, unmount} = renderVapor(Button, {
        props: {isDisabled: true, onClick},
        slots: {default: () => document.createTextNode("Press me")},
      });

      getByRole("button").click();

      expect(onClick).not.toHaveBeenCalled();

      unmount();
    });
  });
});
