import {renderVapor} from "@heroui/testing/helpers/vue";
import {describe, expect, it, vi} from "vitest";
import {nextTick, reactive} from "vue";

import {CloseButton} from "@/components/close-button";

const renderCloseButton = (props: Record<string, unknown> = {}) =>
  renderVapor(CloseButton, {props});

const buttonIn = (container: HTMLElement) => container.querySelector("button");

describe("CloseButton", () => {
  describe("structure", () => {
    it("renders a native button with its data-slot", () => {
      const {container, unmount} = renderCloseButton();
      const button = buttonIn(container);

      expect(button).not.toBeNull();
      expect(button?.getAttribute("data-slot")).toBe("close-button");
      expect(button?.classList.contains("close-button")).toBe(true);

      unmount();
    });

    // Asserted on the IDL property rather than the content attribute: Vue compiles
    // `:type` on a <button> to a DOM property write, and skips it when the value already
    // equals `el.type` — which reads "submit" by default even with no attribute set.
    it("defaults to type button so it never submits a form by accident", () => {
      const {container, unmount} = renderCloseButton();

      expect((buttonIn(container) as HTMLButtonElement).type).toBe("button");

      unmount();
    });

    it("renders the close icon when no content is passed", () => {
      const {container, unmount} = renderCloseButton();
      const icon = container.querySelector('[data-slot="close-button-icon"]');

      expect(icon).not.toBeNull();
      expect(icon?.getAttribute("aria-hidden")).toBe("true");

      unmount();
    });

    it("renders slot content in place of the default icon", () => {
      const {container, unmount} = renderVapor(CloseButton, {
        slots: {default: () => document.createTextNode("✕")},
      });

      expect(container.querySelector('[data-slot="close-button-icon"]')).toBeNull();
      expect(buttonIn(container)?.textContent).toBe("✕");

      unmount();
    });

    it("exposes the variant BEM modifier", () => {
      const {container, unmount} = renderCloseButton({variant: "default"});

      expect(buttonIn(container)?.classList.contains("close-button--default")).toBe(true);

      unmount();
    });
  });

  describe("accessible name", () => {
    it("names itself Close so the icon alone is never the label", () => {
      const {getByRole, unmount} = renderCloseButton();

      expect(getByRole("button", {name: "Close"})).toBeInTheDocument();

      unmount();
    });

    // The default lives on the template rather than behind a prop, which only works
    // because Vue lets a fallthrough attribute win over the one declared there.
    it("lets the caller name what is being closed", () => {
      const {getByRole, unmount} = renderVapor(CloseButton, {
        props: {"aria-label": "Dismiss notification"},
      });

      expect(getByRole("button", {name: "Dismiss notification"})).toBeInTheDocument();

      unmount();
    });
  });

  describe("interaction states", () => {
    it("calls click when activated", async () => {
      const onClick = vi.fn();
      const {getByRole, unmount} = renderVapor(CloseButton, {props: {onClick}});

      getByRole("button").dispatchEvent(new MouseEvent("click", {bubbles: true}));
      await nextTick();

      expect(onClick).toHaveBeenCalledTimes(1);

      unmount();
    });

    it("exposes hover as a data attribute the stylesheet can key on", async () => {
      const {container, unmount} = renderCloseButton();
      const button = buttonIn(container)!;

      button.dispatchEvent(new PointerEvent("pointerenter", {bubbles: true, pointerType: "mouse"}));
      await nextTick();

      expect(button.getAttribute("data-hovered")).toBe("true");

      button.dispatchEvent(new PointerEvent("pointerleave", {bubbles: true, pointerType: "mouse"}));
      await nextTick();

      expect(button.getAttribute("data-hovered")).toBeNull();

      unmount();
    });

    it("exposes press as a data attribute the stylesheet can key on", async () => {
      const {container, unmount} = renderCloseButton();
      const button = buttonIn(container)!;

      button.dispatchEvent(
        new PointerEvent("pointerdown", {bubbles: true, button: 0, pointerType: "mouse"}),
      );
      await nextTick();

      expect(button.getAttribute("data-pressed")).toBe("true");

      window.dispatchEvent(new PointerEvent("pointerup"));
      await nextTick();

      expect(button.getAttribute("data-pressed")).toBeNull();

      unmount();
    });
  });

  describe("disabled", () => {
    it("disables the underlying button", () => {
      const {container, unmount} = renderCloseButton({isDisabled: true});
      const button = buttonIn(container) as HTMLButtonElement;

      expect(button.disabled).toBe(true);
      expect(button.getAttribute("data-disabled")).toBe("true");

      unmount();
    });

    it("reports no interaction state while disabled", async () => {
      const {container, unmount} = renderCloseButton({isDisabled: true});
      const button = buttonIn(container)!;

      button.dispatchEvent(new PointerEvent("pointerenter", {bubbles: true, pointerType: "mouse"}));
      button.dispatchEvent(
        new PointerEvent("pointerdown", {bubbles: true, button: 0, pointerType: "mouse"}),
      );
      await nextTick();

      expect(button.getAttribute("data-hovered")).toBeNull();
      expect(button.getAttribute("data-pressed")).toBeNull();

      unmount();
    });
  });

  describe("pending", () => {
    it("stays focusable but stops activating", async () => {
      const onClick = vi.fn();
      const {getByRole, unmount} = renderVapor(CloseButton, {props: {isPending: true, onClick}});
      const button = getByRole("button") as HTMLButtonElement;

      expect(button.disabled).toBe(false);
      expect(button.getAttribute("aria-disabled")).toBe("true");
      expect(button.getAttribute("data-pending")).toBe("true");

      button.dispatchEvent(new MouseEvent("click", {bubbles: true, cancelable: true}));
      await nextTick();

      expect(onClick).not.toHaveBeenCalled();

      unmount();
    });

    // Blocking the click is not enough on its own: implicit submission reaches the form
    // through the button's own type, without a click ever landing on the button.
    it("drops a pending submit button to type button", async () => {
      const props = reactive({isPending: true, type: "submit"});
      const {container, unmount} = renderVapor(CloseButton, {props});

      expect((buttonIn(container) as HTMLButtonElement).type).toBe("button");

      props.isPending = false;
      await nextTick();

      expect((buttonIn(container) as HTMLButtonElement).type).toBe("submit");

      unmount();
    });
  });
});
