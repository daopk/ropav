import { renderVapor } from "@ropav/testing/helpers/vue";
import { describe, expect, it, vi } from "vitest";

import ButtonGroupFixture from "./fixtures.vue";

const renderGroup = (props: Record<string, unknown> = {}) =>
  renderVapor(ButtonGroupFixture, { props });

describe("ButtonGroup", () => {
  describe("structure", () => {
    it("renders a group with its data-slot", () => {
      const { getByRole, unmount } = renderGroup();
      const group = getByRole("group");

      expect(group.getAttribute("data-slot")).toBe("button-group");
      expect(group.classList.contains("button-group")).toBe(true);

      unmount();
    });

    it("renders a separator that is hidden from assistive technology", () => {
      const { container, unmount } = renderGroup({ withSeparator: true });
      const separator = container.querySelector('[data-slot="button-group-separator"]');

      expect(separator).not.toBeNull();
      expect(separator?.getAttribute("aria-hidden")).toBe("true");
      expect(separator?.classList.contains("button-group__separator")).toBe(true);

      unmount();
    });

    it("merges a caller class", () => {
      const { getByRole, unmount } = renderGroup({ class: "shadow-lg" });
      const group = getByRole("group");

      expect(group.classList.contains("button-group")).toBe(true);
      expect(group.classList.contains("shadow-lg")).toBe(true);

      unmount();
    });
  });

  describe("styling", () => {
    it("defaults to the horizontal orientation", () => {
      const { getByRole, unmount } = renderGroup();

      expect(getByRole("group").classList.contains("button-group--horizontal")).toBe(true);

      unmount();
    });

    it("exposes the vertical orientation modifier", () => {
      const { getByRole, unmount } = renderGroup({ orientation: "vertical" });

      expect(getByRole("group").classList.contains("button-group--vertical")).toBe(true);

      unmount();
    });

    it("exposes the full width modifier", () => {
      const { getByRole, unmount } = renderGroup({ fullWidth: true });

      expect(getByRole("group").classList.contains("button-group--full-width")).toBe(true);

      unmount();
    });
  });

  describe("inherited state", () => {
    it("passes its size and variant to the buttons", () => {
      const { getByRole, unmount } = renderGroup({ size: "sm", variant: "secondary" });
      const button = getByRole("button", { name: "Save" });

      expect(button.classList.contains("button--sm")).toBe(true);
      expect(button.classList.contains("button--secondary")).toBe(true);

      unmount();
    });

    it("passes its disabled state to the buttons", () => {
      const { getByRole, unmount } = renderGroup({ isDisabled: true });

      expect((getByRole("button", { name: "Save" }) as HTMLButtonElement).disabled).toBe(true);

      unmount();
    });

    it("lets a button override the group", () => {
      const { getByRole, unmount } = renderGroup({
        childSize: "lg",
        childVariant: "primary",
        size: "sm",
        variant: "secondary",
      });
      const button = getByRole("button", { name: "Save" });

      expect(button.classList.contains("button--lg")).toBe(true);
      expect(button.classList.contains("button--primary")).toBe(true);
      expect(button.classList.contains("button--sm")).toBe(false);

      unmount();
    });

    it("lets a button opt out of a disabled group", () => {
      const { getByRole, unmount } = renderGroup({ childIsDisabled: false, isDisabled: true });

      expect((getByRole("button", { name: "Save" }) as HTMLButtonElement).disabled).toBe(false);
      expect((getByRole("button", { name: "Cancel" }) as HTMLButtonElement).disabled).toBe(true);

      unmount();
    });

    it("reaches a button nested below the direct children", () => {
      const { getByRole, unmount } = renderGroup({
        nested: true,
        size: "sm",
        variant: "secondary",
      });
      const button = getByRole("button", { name: "Nested" });

      // The stylesheet already targets `.button-group .button` as a descendant, so the
      // context follows the same reach rather than stopping at the direct children.
      expect(button.classList.contains("button--sm")).toBe(true);
      expect(button.classList.contains("button--secondary")).toBe(true);

      unmount();
    });
  });

  describe("events", () => {
    it("emits click from a grouped button", () => {
      const onClick = vi.fn();
      const { getByRole, unmount } = renderVapor(ButtonGroupFixture, { props: { onClick } });

      getByRole("button", { name: "Save" }).click();

      expect(onClick).toHaveBeenCalledTimes(1);

      unmount();
    });

    it("does not emit click from a button disabled by the group", () => {
      const onClick = vi.fn();
      const { getByRole, unmount } = renderVapor(ButtonGroupFixture, {
        props: { isDisabled: true, onClick },
      });

      getByRole("button", { name: "Save" }).click();

      expect(onClick).not.toHaveBeenCalled();

      unmount();
    });
  });
});
