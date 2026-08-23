import { renderVapor } from "@ropav/testing/helpers/vue";
import { describe, expect, it } from "vitest";
import { nextTick } from "vue";

import Fixture from "./fixtures.vue";

const renderToolbar = async (props: Record<string, unknown> = {}) => {
  const result = renderVapor(Fixture, { props });

  // A toolbar reads whether it is nested from its own ancestors once it is in the document,
  // so the roles inside only settle after the first flush.
  await nextTick();

  const toolbar = result.container.querySelector<HTMLElement>('[data-slot="toolbar"]');

  if (!toolbar) throw new Error("toolbar not rendered");

  return { ...result, toolbar };
};

const controlsIn = (container: HTMLElement) => [...container.querySelectorAll("button")];

const press = async (key: string, options: KeyboardEventInit = {}) => {
  document.activeElement?.dispatchEvent(
    new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key, ...options }),
  );
  await nextTick();
};

describe("Toolbar", () => {
  describe("structure", () => {
    it("renders a toolbar with its data-slot and BEM class", async () => {
      const { toolbar, unmount } = await renderToolbar();

      expect(toolbar).toHaveAttribute("data-slot", "toolbar");
      expect(toolbar).toHaveClass("toolbar");

      unmount();
    });

    it("takes its accessible name from the caller", async () => {
      const { getByRole, unmount } = await renderToolbar();

      expect(getByRole("toolbar", { name: "Text formatting" })).toBeInTheDocument();

      unmount();
    });

    it("defaults to the horizontal orientation", async () => {
      const { toolbar, unmount } = await renderToolbar();

      expect(toolbar).toHaveAttribute("aria-orientation", "horizontal");
      expect(toolbar).toHaveAttribute("data-orientation", "horizontal");
      expect(toolbar).toHaveClass("toolbar--horizontal");

      unmount();
    });

    it("exposes the vertical orientation modifier", async () => {
      const { toolbar, unmount } = await renderToolbar({ orientation: "vertical" });

      expect(toolbar).toHaveAttribute("aria-orientation", "vertical");
      expect(toolbar).toHaveAttribute("data-orientation", "vertical");
      expect(toolbar).toHaveClass("toolbar--vertical");

      unmount();
    });

    it("exposes the attached modifier", async () => {
      const { toolbar, unmount } = await renderToolbar({ isAttached: true });

      expect(toolbar).toHaveClass("toolbar--attached");

      unmount();
    });

    it("merges a caller class", async () => {
      const { toolbar, unmount } = await renderToolbar({ class: "gap-4" });

      expect(toolbar).toHaveClass("toolbar", "gap-4");

      unmount();
    });
  });

  /**
   * A toolbar knows the axis of the things inside it better than each caller does, so the
   * groups follow its orientation and a rule between them runs across it. Both are still
   * only defaults: naming an orientation on the part wins.
   */
  describe("orientation handed down", () => {
    const groupsIn = (container: HTMLElement) => ({
      buttonGroup: container.querySelector('[data-slot="button-group"]')!,
      separator: container.querySelector('[data-slot="separator"]')!,
      toggleGroup: container.querySelector('[data-slot="toggle-button-group"]')!,
    });

    it("lays the groups out along its own axis", async () => {
      const { container, unmount } = await renderToolbar({ orientation: "vertical" });
      const { buttonGroup, toggleGroup } = groupsIn(container);

      expect(toggleGroup).toHaveAttribute("data-orientation", "vertical");
      expect(toggleGroup).toHaveClass("toggle-button-group--vertical");
      expect(buttonGroup).toHaveClass("button-group--vertical");

      unmount();
    });

    it("keeps the groups horizontal in a horizontal toolbar", async () => {
      const { container, unmount } = await renderToolbar();
      const { buttonGroup, toggleGroup } = groupsIn(container);

      expect(toggleGroup).toHaveAttribute("data-orientation", "horizontal");
      expect(buttonGroup).toHaveClass("button-group--horizontal");

      unmount();
    });

    it("lets a group name its own orientation", async () => {
      const { container, unmount } = await renderToolbar({
        groupOrientation: "horizontal",
        orientation: "vertical",
      });
      const { buttonGroup, toggleGroup } = groupsIn(container);

      expect(toggleGroup).toHaveAttribute("data-orientation", "horizontal");
      expect(buttonGroup).toHaveClass("button-group--horizontal");

      unmount();
    });

    it("turns a separator across its own axis", async () => {
      const { container, unmount } = await renderToolbar();
      const { separator } = groupsIn(container);

      expect(separator.tagName).toBe("DIV");
      expect(separator).toHaveAttribute("data-orientation", "vertical");
      expect(separator).toHaveAttribute("aria-orientation", "vertical");
      expect(separator).toHaveClass("separator--vertical");

      unmount();
    });

    it("turns a separator along the row in a vertical toolbar", async () => {
      const { container, unmount } = await renderToolbar({ orientation: "vertical" });
      const { separator } = groupsIn(container);

      expect(separator.tagName).toBe("HR");
      expect(separator).toHaveAttribute("data-orientation", "horizontal");
      expect(separator).toHaveClass("separator--horizontal");

      unmount();
    });

    it("lets a separator name its own orientation", async () => {
      const { container, unmount } = await renderToolbar({ separatorOrientation: "horizontal" });
      const { separator } = groupsIn(container);

      expect(separator).toHaveAttribute("data-orientation", "horizontal");

      unmount();
    });
  });

  /**
   * Toolbars do not nest as far as assistive technology is concerned, and only one of them
   * can own the keyboard — otherwise a single arrow press would be handled twice.
   */
  describe("nesting", () => {
    it("reports a group rather than a second toolbar", async () => {
      const { container, unmount } = await renderToolbar({ withNestedToolbar: true });
      const [outer, inner] = [...container.querySelectorAll('[data-slot="toolbar"]')];

      expect(outer).toHaveAttribute("role", "toolbar");
      expect(inner).toHaveAttribute("role", "group");

      unmount();
    });

    it("reports a group for a multi-select toggle group inside it", async () => {
      const { container, unmount } = await renderToolbar();
      const toggleGroup = container.querySelector('[data-slot="toggle-button-group"]');

      expect(toggleGroup).toHaveAttribute("role", "group");

      unmount();
    });

    it("moves focus once per arrow press, not once per nested group", async () => {
      const { container, unmount } = await renderToolbar({ withNestedToolbar: true });
      const [bold, italic] = controlsIn(container);

      bold!.focus();
      await press("ArrowRight");

      expect(document.activeElement).toBe(italic);

      unmount();
    });
  });

  /**
   * The arrow keys walk every control in the toolbar, groups and all — the groups are a
   * visual and semantic grouping, not a boundary for focus.
   */
  describe("keyboard navigation", () => {
    it("moves focus across group boundaries with the arrow keys", async () => {
      const { container, unmount } = await renderToolbar();
      const [, italic, copy] = controlsIn(container);

      italic!.focus();

      await press("ArrowRight");
      expect(document.activeElement).toBe(copy);

      await press("ArrowLeft");
      expect(document.activeElement).toBe(italic);

      unmount();
    });

    it("stops at the ends rather than wrapping", async () => {
      const { container, unmount } = await renderToolbar();
      const controls = controlsIn(container);
      const first = controls[0]!;
      const last = controls[controls.length - 1]!;

      first.focus();
      await press("ArrowLeft");
      expect(document.activeElement).toBe(first);

      last.focus();
      await press("ArrowRight");
      expect(document.activeElement).toBe(last);

      unmount();
    });

    it("uses the block-axis arrows when vertical", async () => {
      const { container, unmount } = await renderToolbar({ orientation: "vertical" });
      const [bold, italic] = controlsIn(container);

      bold!.focus();

      await press("ArrowDown");
      expect(document.activeElement).toBe(italic);

      await press("ArrowUp");
      expect(document.activeElement).toBe(bold);

      unmount();
    });

    it("ignores the arrow keys of the other axis", async () => {
      const { container, unmount } = await renderToolbar();
      const [bold] = controlsIn(container);

      bold!.focus();
      await press("ArrowDown");

      expect(document.activeElement).toBe(bold);

      unmount();
    });

    // Parking focus at the far end first is what makes one Tab leave the whole toolbar
    // instead of stepping through the rest of its controls.
    it("parks focus at the far end on Tab so the toolbar is left in one press", async () => {
      const { container, unmount } = await renderToolbar();
      const controls = controlsIn(container);
      const first = controls[0]!;
      const last = controls[controls.length - 1]!;

      first.focus();
      await press("Tab");
      expect(document.activeElement).toBe(last);

      last.focus();
      await press("Tab", { shiftKey: true });
      expect(document.activeElement).toBe(first);

      unmount();
    });

    it("keeps every control tabbable rather than using a roving tabindex", async () => {
      const { container, unmount } = await renderToolbar();

      for (const control of controlsIn(container)) {
        expect(control.getAttribute("tabindex")).not.toBe("-1");
      }

      unmount();
    });

    it("returns focus to the control it was last on", async () => {
      const { container, unmount } = await renderToolbar();
      const outside = document.createElement("button");

      document.body.appendChild(outside);

      const [, italic] = controlsIn(container);

      italic!.focus();
      outside.focus();
      expect(document.activeElement).toBe(outside);

      // Coming back lands wherever the browser puts it first; the toolbar then corrects it.
      controlsIn(container)[0]!.focus();
      expect(document.activeElement).toBe(italic);

      outside.remove();
      unmount();
    });
  });
});
