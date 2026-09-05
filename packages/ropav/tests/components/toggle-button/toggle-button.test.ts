import { renderVapor } from "@ropav/testing/helpers/vue";
import { describe, expect, it, vi } from "vitest";
import { nextTick, reactive } from "vue";

import { ToggleButton } from "@/components/toggle-button";

const renderToggleButton = (props: Record<string, unknown> = {}) =>
  renderVapor(ToggleButton, {
    props,
    slots: { default: () => document.createTextNode("Like") },
  });

const buttonIn = (container: HTMLElement) => container.querySelector("button")!;

const clickAndSettle = async (button: HTMLElement) => {
  button.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  await nextTick();
};

describe("ToggleButton", () => {
  describe("structure", () => {
    it("renders a native button with its data-slot", () => {
      const { container, unmount } = renderToggleButton();
      const button = buttonIn(container);

      expect(button.getAttribute("data-slot")).toBe("toggle-button");
      expect(button.classList.contains("rp-toggle-button")).toBe(true);

      unmount();
    });

    it("renders slot content as its accessible name", () => {
      const { getByRole, unmount } = renderToggleButton();

      expect(getByRole("button", { name: "Like" })).toBeInTheDocument();

      unmount();
    });

    // Asserted on the IDL property rather than the content attribute: Vue compiles
    // `:type` on a <button> to a DOM property write, and skips it when the value already
    // equals `el.type` — which reads "submit" by default even with no attribute set.
    it("defaults to type button so it never submits a form by accident", () => {
      const { container, unmount } = renderToggleButton();

      expect(buttonIn(container).type).toBe("button");

      unmount();
    });

    it("exposes the size, variant and icon-only BEM modifiers", () => {
      const { container, unmount } = renderToggleButton({
        isIconOnly: true,
        size: "lg",
        variant: "ghost",
      });
      const button = buttonIn(container);

      expect(button.classList.contains("rp-toggle-button--lg")).toBe(true);
      expect(button.classList.contains("rp-toggle-button--ghost")).toBe(true);
      expect(button.classList.contains("rp-toggle-button--icon-only")).toBe(true);

      unmount();
    });
  });

  /**
   * Standalone, a toggle button is an independent on/off control — `aria-pressed` rather
   * than the `role="radio"` it takes on inside a single-selection group.
   */
  describe("selection", () => {
    it("reports itself as an unpressed button by default", () => {
      const { container, unmount } = renderToggleButton();
      const button = buttonIn(container);

      expect(button.getAttribute("aria-pressed")).toBe("false");
      expect(button.getAttribute("data-selected")).toBeNull();
      expect(button.getAttribute("role")).toBeNull();

      unmount();
    });

    it("starts selected from defaultSelected", () => {
      const { container, unmount } = renderToggleButton({ defaultSelected: true });
      const button = buttonIn(container);

      expect(button.getAttribute("aria-pressed")).toBe("true");
      expect(button.getAttribute("data-selected")).toBe("true");

      unmount();
    });

    it("flips on click", async () => {
      const { container, unmount } = renderToggleButton();
      const button = buttonIn(container);

      await clickAndSettle(button);
      expect(button.getAttribute("aria-pressed")).toBe("true");

      await clickAndSettle(button);
      expect(button.getAttribute("aria-pressed")).toBe("false");

      unmount();
    });

    it("emits change with the next state", async () => {
      const onChange = vi.fn();
      const { container, unmount } = renderVapor(ToggleButton, { props: { onChange } });

      await clickAndSettle(buttonIn(container));

      expect(onChange).toHaveBeenCalledWith(true);

      unmount();
    });

    it("defers to isSelected when controlled", async () => {
      const onChange = vi.fn();
      const props = reactive<Record<string, unknown>>({ isSelected: false, onChange });
      const { container, unmount } = renderVapor(ToggleButton, { props });
      const button = buttonIn(container);

      await clickAndSettle(button);

      // The owner of `isSelected` decides, so nothing moves until it says so.
      expect(button.getAttribute("aria-pressed")).toBe("false");
      expect(onChange).toHaveBeenCalledWith(true);

      props["isSelected"] = true;
      await nextTick();

      expect(button.getAttribute("aria-pressed")).toBe("true");

      unmount();
    });

    it("exposes the selected state to its slot", () => {
      const { container, unmount } = renderVapor(ToggleButton, {
        props: { defaultSelected: true },
        slots: {
          default: (slotProps = {}) =>
            document.createTextNode(slotProps["isSelected"] ? "Liked" : "Like"),
        },
      });

      expect(buttonIn(container).textContent).toBe("Liked");

      unmount();
    });
  });

  describe("interaction states", () => {
    it("exposes hover as a data attribute the stylesheet can key on", async () => {
      const { container, unmount } = renderToggleButton();
      const button = buttonIn(container);

      button.dispatchEvent(
        new PointerEvent("pointerenter", { bubbles: true, pointerType: "mouse" }),
      );
      await nextTick();

      expect(button.getAttribute("data-hovered")).toBe("true");

      unmount();
    });

    it("exposes press as a data attribute the stylesheet can key on", async () => {
      const { container, unmount } = renderToggleButton();
      const button = buttonIn(container);

      button.dispatchEvent(
        new PointerEvent("pointerdown", { bubbles: true, button: 0, pointerType: "mouse" }),
      );
      await nextTick();

      expect(button.getAttribute("data-pressed")).toBe("true");

      window.dispatchEvent(new PointerEvent("pointerup"));
      await nextTick();

      expect(button.getAttribute("data-pressed")).toBeNull();

      unmount();
    });

    it("calls click when activated", async () => {
      const onClick = vi.fn();
      const { container, unmount } = renderVapor(ToggleButton, { props: { onClick } });

      await clickAndSettle(buttonIn(container));

      expect(onClick).toHaveBeenCalledTimes(1);

      unmount();
    });
  });

  describe("tab order", () => {
    // Written even though a native button is already tabbable: Safari does not focus one
    // unless an explicit tab index says so, which is why react-aria always sets it.
    it("renders an explicit tab index", () => {
      const { container, unmount } = renderToggleButton();

      expect(buttonIn(container)).toHaveAttribute("tabindex", "0");

      unmount();
    });

    it("drops the tab index when disabled, so it is not reachable at all", () => {
      const { container, unmount } = renderToggleButton({ isDisabled: true });

      expect(buttonIn(container).hasAttribute("tabindex")).toBe(false);

      unmount();
    });
  });

  describe("disabled", () => {
    it("disables the underlying button", () => {
      const { container, unmount } = renderToggleButton({ isDisabled: true });
      const button = buttonIn(container);

      expect(button.disabled).toBe(true);
      expect(button.getAttribute("data-disabled")).toBe("true");

      unmount();
    });

    it("does not flip while disabled", async () => {
      const { container, unmount } = renderToggleButton({ isDisabled: true });
      const button = buttonIn(container);

      await clickAndSettle(button);

      expect(button.getAttribute("aria-pressed")).toBe("false");

      unmount();
    });
  });
});
