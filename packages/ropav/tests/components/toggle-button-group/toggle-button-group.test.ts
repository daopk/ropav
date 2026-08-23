import { renderVapor } from "@ropav/testing/helpers/vue";
import { describe, expect, it, vi } from "vitest";
import { nextTick, reactive } from "vue";

import Fixture from "./fixtures.vue";

const renderGroup = (props: Record<string, unknown> = {}) => renderVapor(Fixture, { props });

const buttonsIn = (container: HTMLElement) => [
  ...container.querySelectorAll<HTMLElement>('[data-slot="toggle-button"]'),
];

const selectionOf = (container: HTMLElement) =>
  buttonsIn(container).map((button) => button.getAttribute("data-selected"));

const clickAndSettle = async (button: HTMLElement) => {
  button.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  await nextTick();
};

describe("ToggleButtonGroup", () => {
  describe("structure", () => {
    it("renders a group with its data-slot and BEM class", () => {
      const { getByRole, unmount } = renderGroup();
      const group = getByRole("radiogroup");

      expect(group.getAttribute("data-slot")).toBe("toggle-button-group");
      expect(group.classList.contains("toggle-button-group")).toBe(true);

      unmount();
    });

    it("defaults to the horizontal orientation", () => {
      const { getByRole, unmount } = renderGroup();
      const group = getByRole("radiogroup");

      expect(group.getAttribute("data-orientation")).toBe("horizontal");
      expect(group.getAttribute("aria-orientation")).toBe("horizontal");
      expect(group.classList.contains("toggle-button-group--horizontal")).toBe(true);

      unmount();
    });

    it("exposes the vertical orientation modifier", () => {
      const { getByRole, unmount } = renderGroup({ orientation: "vertical" });
      const group = getByRole("radiogroup");

      expect(group.getAttribute("data-orientation")).toBe("vertical");
      expect(group.getAttribute("aria-orientation")).toBe("vertical");
      expect(group.classList.contains("toggle-button-group--vertical")).toBe(true);

      unmount();
    });

    it("exposes the detached and full-width modifiers", () => {
      const { getByRole, unmount } = renderGroup({ fullWidth: true, isDetached: true });
      const group = getByRole("radiogroup");

      expect(group.classList.contains("toggle-button-group--detached")).toBe(true);
      expect(group.classList.contains("toggle-button-group--full-width")).toBe(true);

      unmount();
    });

    it("renders a separator that is hidden from assistive technology", () => {
      const { container, unmount } = renderGroup({ withSeparator: true });
      const separator = container.querySelector('[data-slot="toggle-button-group-separator"]');

      expect(separator).not.toBeNull();
      expect(separator?.getAttribute("aria-hidden")).toBe("true");
      expect(separator?.classList.contains("toggle-button-group__separator")).toBe(true);

      unmount();
    });
  });

  /**
   * Single selection is a set of mutually exclusive choices rather than a row of
   * independent switches, so the roles change with the mode — the same swap React Aria
   * makes. Carrying both `aria-pressed` and `aria-checked` would describe each button
   * twice, so only one is ever present.
   */
  describe("roles", () => {
    it("reports a radiogroup of radios in single selection mode", () => {
      const { container, getByRole, unmount } = renderGroup({ selectionMode: "single" });

      expect(getByRole("radiogroup")).toBeInTheDocument();

      for (const button of buttonsIn(container)) {
        expect(button.getAttribute("role")).toBe("radio");
        expect(button.getAttribute("aria-checked")).not.toBeNull();
        expect(button.getAttribute("aria-pressed")).toBeNull();
      }

      unmount();
    });

    it("reports a toolbar of pressed buttons in multiple selection mode", () => {
      const { container, getByRole, unmount } = renderGroup({ selectionMode: "multiple" });

      expect(getByRole("toolbar")).toBeInTheDocument();

      for (const button of buttonsIn(container)) {
        expect(button.getAttribute("role")).toBeNull();
        expect(button.getAttribute("aria-pressed")).not.toBeNull();
        expect(button.getAttribute("aria-checked")).toBeNull();
      }

      unmount();
    });

    it("keeps aria-checked in step with the selection", async () => {
      const { container, unmount } = renderGroup({
        defaultSelectedKeys: ["bold"],
        selectionMode: "single",
      });
      const [bold, italic] = buttonsIn(container);

      expect(bold!.getAttribute("aria-checked")).toBe("true");
      expect(italic!.getAttribute("aria-checked")).toBe("false");

      await clickAndSettle(italic!);

      expect(bold!.getAttribute("aria-checked")).toBe("false");
      expect(italic!.getAttribute("aria-checked")).toBe("true");

      unmount();
    });
  });

  describe("selection", () => {
    it("starts from defaultSelectedKeys", () => {
      const { container, unmount } = renderGroup({ defaultSelectedKeys: ["italic"] });

      expect(selectionOf(container)).toEqual([null, "true", null]);

      unmount();
    });

    it("replaces the selection in single mode", async () => {
      const { container, unmount } = renderGroup({
        defaultSelectedKeys: ["bold"],
        selectionMode: "single",
      });

      await clickAndSettle(buttonsIn(container)[2]!);

      expect(selectionOf(container)).toEqual([null, null, "true"]);

      unmount();
    });

    it("adds to the selection in multiple mode", async () => {
      const { container, unmount } = renderGroup({
        defaultSelectedKeys: ["bold"],
        selectionMode: "multiple",
      });

      await clickAndSettle(buttonsIn(container)[2]!);

      expect(selectionOf(container)).toEqual(["true", null, "true"]);

      unmount();
    });

    it("clears a selected button when emptiness is allowed", async () => {
      const { container, unmount } = renderGroup({
        defaultSelectedKeys: ["bold"],
        selectionMode: "single",
      });

      await clickAndSettle(buttonsIn(container)[0]!);

      expect(selectionOf(container)).toEqual([null, null, null]);

      unmount();
    });

    it("keeps the last selected button when emptiness is disallowed", async () => {
      const { container, unmount } = renderGroup({
        defaultSelectedKeys: ["bold"],
        disallowEmptySelection: true,
        selectionMode: "single",
      });

      await clickAndSettle(buttonsIn(container)[0]!);

      expect(selectionOf(container)).toEqual(["true", null, null]);

      unmount();
    });

    it("keeps the last of several selected buttons when emptiness is disallowed", async () => {
      const { container, unmount } = renderGroup({
        defaultSelectedKeys: ["bold", "italic"],
        disallowEmptySelection: true,
        selectionMode: "multiple",
      });
      const [bold, italic] = buttonsIn(container);

      // Two selected, so one can still go.
      await clickAndSettle(italic!);
      expect(selectionOf(container)).toEqual(["true", null, null]);

      // One left, so it stays.
      await clickAndSettle(bold!);
      expect(selectionOf(container)).toEqual(["true", null, null]);

      unmount();
    });

    it("emits selectionChange with the next key set", async () => {
      const onSelectionChange = vi.fn();
      const { container, unmount } = renderVapor(Fixture, {
        props: { onSelectionChange, selectionMode: "multiple" },
      });

      await clickAndSettle(buttonsIn(container)[1]!);

      expect(onSelectionChange).toHaveBeenCalledTimes(1);
      expect([...onSelectionChange.mock.calls[0]![0]]).toEqual(["italic"]);

      unmount();
    });

    it("defers to selectedKeys when controlled", async () => {
      const onSelectionChange = vi.fn();
      const props = reactive<Record<string, unknown>>({
        onSelectionChange,
        selectedKeys: ["bold"],
        selectionMode: "multiple",
      });
      const { container, unmount } = renderVapor(Fixture, { props });

      await clickAndSettle(buttonsIn(container)[1]!);

      // The owner of `selectedKeys` decides, so nothing moves until it says so.
      expect(selectionOf(container)).toEqual(["true", null, null]);
      expect(onSelectionChange).toHaveBeenCalledTimes(1);

      props["selectedKeys"] = ["bold", "italic"];
      await nextTick();

      expect(selectionOf(container)).toEqual(["true", "true", null]);

      unmount();
    });
  });

  describe("disabled", () => {
    it("disables every button in the group", () => {
      const { container, getByRole, unmount } = renderGroup({ isDisabled: true });

      expect(getByRole("radiogroup").getAttribute("aria-disabled")).toBe("true");

      for (const button of buttonsIn(container)) {
        expect((button as HTMLButtonElement).disabled).toBe(true);
      }

      unmount();
    });

    it("lets a single button opt out of an enabled group", () => {
      const { container, unmount } = renderGroup({ childIsDisabled: true });
      const [bold, italic] = buttonsIn(container);

      expect((bold as HTMLButtonElement).disabled).toBe(true);
      expect((italic as HTMLButtonElement).disabled).toBe(false);

      unmount();
    });

    it("does not change the selection while disabled", async () => {
      const { container, unmount } = renderGroup({
        defaultSelectedKeys: ["bold"],
        isDisabled: true,
        selectionMode: "multiple",
      });

      await clickAndSettle(buttonsIn(container)[1]!);

      expect(selectionOf(container)).toEqual(["true", null, null]);

      unmount();
    });
  });

  describe("size", () => {
    it("propagates its size to every button", () => {
      const { container, unmount } = renderGroup({ size: "lg" });

      for (const button of buttonsIn(container)) {
        expect(button.classList.contains("toggle-button--lg")).toBe(true);
      }

      unmount();
    });
  });

  /**
   * A toolbar is one tab stop's worth of meaning but not of markup: every button stays
   * tabbable and the arrow keys move between them.
   */
  describe("keyboard navigation", () => {
    const press = async (key: string, options: KeyboardEventInit = {}) => {
      document.activeElement?.dispatchEvent(
        new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key, ...options }),
      );
      await nextTick();
    };

    it("moves focus along the group with the arrow keys", async () => {
      const { container, unmount } = renderGroup({ selectionMode: "multiple" });
      const [bold, italic, underline] = buttonsIn(container);

      bold!.focus();

      await press("ArrowRight");
      expect(document.activeElement).toBe(italic);

      await press("ArrowRight");
      expect(document.activeElement).toBe(underline);

      await press("ArrowLeft");
      expect(document.activeElement).toBe(italic);

      unmount();
    });

    it("stops at the ends rather than wrapping", async () => {
      const { container, unmount } = renderGroup({ selectionMode: "multiple" });
      const [bold, , underline] = buttonsIn(container);

      bold!.focus();
      await press("ArrowLeft");
      expect(document.activeElement).toBe(bold);

      underline!.focus();
      await press("ArrowRight");
      expect(document.activeElement).toBe(underline);

      unmount();
    });

    it("uses the block-axis arrows in a vertical group", async () => {
      const { container, unmount } = renderGroup({
        orientation: "vertical",
        selectionMode: "multiple",
      });
      const [bold, italic] = buttonsIn(container);

      bold!.focus();

      await press("ArrowDown");
      expect(document.activeElement).toBe(italic);

      await press("ArrowUp");
      expect(document.activeElement).toBe(bold);

      unmount();
    });

    it("ignores the arrow keys of the other axis", async () => {
      const { container, unmount } = renderGroup({ selectionMode: "multiple" });
      const [bold] = buttonsIn(container);

      bold!.focus();
      await press("ArrowDown");

      expect(document.activeElement).toBe(bold);

      unmount();
    });

    // Parking focus at the far end first is what makes one Tab leave the whole toolbar
    // instead of stepping through the rest of its buttons.
    it("parks focus at the far end on Tab so the group is left in one press", async () => {
      const { container, unmount } = renderGroup({ selectionMode: "multiple" });
      const [bold, , underline] = buttonsIn(container);

      bold!.focus();
      await press("Tab");
      expect(document.activeElement).toBe(underline);

      underline!.focus();
      await press("Tab", { shiftKey: true });
      expect(document.activeElement).toBe(bold);

      unmount();
    });

    it("keeps every button tabbable rather than using a roving tabindex", () => {
      const { container, unmount } = renderGroup({ selectionMode: "multiple" });

      for (const button of buttonsIn(container)) {
        expect(button.getAttribute("tabindex")).not.toBe("-1");
      }

      unmount();
    });
  });
});
