import {renderVapor} from "@heroui/testing/helpers/vue";
import {describe, expect, it, vi} from "vitest";

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

    it("renders slot content", () => {
      const {getByRole, unmount} = renderButton();

      expect(getByRole("button").textContent).toContain("Press me");

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

    it("marks itself aria-disabled while staying focusable", () => {
      const {container, unmount} = renderButton({isPending: true});
      const button = buttonIn(container);

      expect(button?.getAttribute("aria-disabled")).toBe("true");
      // Not `disabled`, so assistive technology can still reach and announce it.
      expect(button?.hasAttribute("disabled")).toBe(false);

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
