import type {CollectionKey} from "@/composables/use-collection";

import {renderVapor} from "@heroui/testing/helpers/vue";
import {describe, expect, it, vi} from "vitest";
import {nextTick} from "vue";

import Tabs from "./fixtures.vue";

/**
 * Mount the fixture and wait for the tabs to register.
 *
 * The collection learns its members from the DOM, so everything derived from it — the fallback
 * selection, the roving tab index, the ids on the panels — settles a tick after the first render.
 */
const render = async (props: Record<string, unknown> = {}) => {
  const rendered = renderVapor(Tabs, {props});

  await nextTick();
  await nextTick();

  return rendered;
};

/**
 * Let the panels finish changing over.
 *
 * A panel losing the selection stays mounted until its exit animation is done. jsdom implements
 * none, so the wait settles at once — but it still costs a tick, during which both panels are in
 * the document.
 */
const settle = async (ticks = 4) => {
  for (let index = 0; index < ticks; index += 1) await nextTick();
};

const keydown = (element: Element, key: string, init: KeyboardEventInit = {}) => {
  const event = new KeyboardEvent("keydown", {bubbles: true, cancelable: true, key, ...init});

  element.dispatchEvent(event);

  return event;
};

const press = (element: Element) => {
  element.dispatchEvent(
    new PointerEvent("pointerdown", {bubbles: true, button: 0, cancelable: true}),
  );
};

describe("Tabs", () => {
  describe("structure", () => {
    it("exposes the data slots and the BEM block", async () => {
      const {container} = await render();
      const root = container.querySelector('[data-slot="tabs"]')!;

      expect(root.className).toContain("tabs");
      expect(container.querySelector('[data-slot="tabs-list-container"]')!.className).toContain(
        "tabs__list-container",
      );
      expect(container.querySelector('[data-slot="tabs-list"]')!.className).toContain("tabs__list");
      expect(container.querySelectorAll('[data-slot="tabs-tab"]')).toHaveLength(3);
      expect(container.querySelector('[data-slot="tabs-tab"]')!.className).toContain("tabs__tab");
      expect(container.querySelector('[data-slot="tabs-panel"]')!.className).toContain(
        "tabs__panel",
      );
    });

    it("renders the indicator only inside the selected tab", async () => {
      const {container} = await render();
      const indicators = container.querySelectorAll('[data-slot="tabs-indicator"]');

      expect(indicators).toHaveLength(1);
      expect(indicators[0]!.className).toContain("tabs__indicator");
      expect(indicators[0]!.closest('[data-slot="tabs-tab"]')).toHaveTextContent("Overview");
    });

    it("renders the indicator inside a selected tab that is not the first", async () => {
      const {container} = await render({defaultSelectedKey: "analytics"});
      const indicators = container.querySelectorAll('[data-slot="tabs-indicator"]');

      expect(indicators).toHaveLength(1);
      expect(indicators[0]!.closest('[data-slot="tabs-tab"]')).toHaveTextContent("Analytics");
    });

    it("renders a separator inside every tab that asks for one", async () => {
      const {container} = await render({withSeparator: true});
      const separators = container.querySelectorAll('[data-slot="tabs-separator"]');

      expect(separators).toHaveLength(3);
      expect(separators[0]!.className).toContain("tabs__separator");
      expect(separators[0]).toHaveAttribute("aria-hidden", "true");
    });

    it("exposes the variant modifier", async () => {
      const {container} = await render({variant: "secondary"});

      expect(container.querySelector('[data-slot="tabs"]')!.className).toContain("tabs--secondary");
    });

    it("lets a caller's class override the slot's own", async () => {
      const {container} = await render({class: "p-10"});

      expect(container.querySelector('[data-slot="tabs"]')!.className).toContain("p-10");
    });

    it("works without a list container", async () => {
      const {container, getAllByRole} = await render({withContainer: false});

      expect(container.querySelector('[data-slot="tabs-list-container"]')).toBeNull();
      expect(container.querySelector('[data-slot="tabs-list"]')).not.toBeNull();
      expect(getAllByRole("tab")).toHaveLength(3);
    });
  });

  describe("accessibility", () => {
    it("exposes the tab list roles and orientation", async () => {
      const {getByRole} = await render();
      const list = getByRole("tablist");

      expect(list).toHaveAttribute("aria-orientation", "horizontal");
      expect(list).toHaveAttribute("aria-label", "Options");
    });

    it("reports a vertical orientation on the root, the list and nothing else", async () => {
      const {container, getByRole} = await render({orientation: "vertical"});

      expect(container.querySelector('[data-slot="tabs"]')).toHaveAttribute(
        "data-orientation",
        "vertical",
      );
      expect(getByRole("tablist")).toHaveAttribute("aria-orientation", "vertical");
    });

    it("ties each tab to its panel through one derived base", async () => {
      const {container, getByRole} = await render();
      const selected = getByRole("tab", {selected: true});
      const panel = container.querySelector('[data-slot="tabs-panel"]')!;

      expect(selected.id).toMatch(/-tab-overview$/);
      expect(panel.id).toMatch(/-tabpanel-overview$/);
      expect(selected).toHaveAttribute("aria-controls", panel.id);
      expect(panel).toHaveAttribute("aria-labelledby", selected.id);
      expect(panel).toHaveAttribute("role", "tabpanel");
    });

    it("keeps a caller's id off the DOM", async () => {
      const {container, getByRole} = await render({id: "settings"});

      expect(getByRole("tab", {selected: true}).id).toBe("settings-tab-overview");
      expect(container.querySelector('[data-slot="tabs-panel"]')!.id).toBe(
        "settings-tabpanel-overview",
      );
      // The tab list carries the base itself, which is what React Aria does.
      expect(getByRole("tablist").id).toBe("settings");
    });

    it("names no panel from an unselected tab", async () => {
      const {getAllByRole} = await render();
      const [, analytics] = getAllByRole("tab");

      expect(analytics).not.toHaveAttribute("aria-controls");
      expect(analytics).toHaveAttribute("aria-selected", "false");
    });

    it("makes only the selected tab a tab stop", async () => {
      const {getAllByRole, getByRole} = await render();
      const [overview, analytics, reports] = getAllByRole("tab");

      expect(overview).toHaveAttribute("tabindex", "0");
      expect(analytics).toHaveAttribute("tabindex", "-1");
      expect(reports).toHaveAttribute("tabindex", "-1");
      // The list itself is never a tab stop, so the roving index is the only way in.
      expect(getByRole("tablist")).not.toHaveAttribute("tabindex");
    });

    it("gives a disabled tab no tab stop at all", async () => {
      const {getAllByRole} = await render({
        items: [
          {id: "overview", label: "Overview"},
          {id: "blocked", isDisabled: true, label: "Blocked"},
        ],
      });
      const [, blocked] = getAllByRole("tab");

      expect(blocked).toHaveAttribute("aria-disabled", "true");
      expect(blocked).toHaveAttribute("data-disabled", "true");
      expect(blocked).not.toHaveAttribute("tabindex");
    });
  });

  describe("selection", () => {
    it("selects the first tab when nothing says which", async () => {
      const {getByRole} = await render();

      expect(getByRole("tab", {selected: true})).toHaveTextContent("Overview");
    });

    it("skips a disabled first tab", async () => {
      const {getByRole} = await render({disabledKeys: ["overview"]});

      expect(getByRole("tab", {selected: true})).toHaveTextContent("Analytics");
    });

    it("honours a default", async () => {
      const {getByRole} = await render({defaultSelectedKey: "reports"});

      expect(getByRole("tab", {selected: true})).toHaveTextContent("Reports");
    });

    it("reports nothing as changed on mount", async () => {
      const onSelectionChange = vi.fn();

      await render({onSelectionChange});

      expect(onSelectionChange).not.toHaveBeenCalled();
    });

    it("selects on press and moves the panel with it", async () => {
      const onSelectionChange = vi.fn();
      const {container, getAllByRole} = await render({onSelectionChange});

      press(getAllByRole("tab")[1]!);
      await settle();

      expect(onSelectionChange).toHaveBeenCalledWith("analytics");
      expect(getAllByRole("tab")[1]).toHaveAttribute("aria-selected", "true");

      const panels = container.querySelectorAll('[data-slot="tabs-panel"]');

      expect(panels).toHaveLength(1);
      expect(panels[0]).toHaveTextContent("Analytics panel");
      expect(panels[0]!.id).toBe(getAllByRole("tab")[1]!.getAttribute("aria-controls"));
    });

    it("leaves a disabled tab unselected", async () => {
      const onSelectionChange = vi.fn();
      const {getAllByRole, getByRole} = await render({
        disabledKeys: ["reports"],
        onSelectionChange,
      });

      press(getAllByRole("tab")[2]!);
      await nextTick();

      expect(getByRole("tab", {selected: true})).toHaveTextContent("Overview");
      expect(onSelectionChange).not.toHaveBeenCalled();
    });

    it("follows a controlled key and reports without moving on its own", async () => {
      const onSelectionChange = vi.fn();
      const {getAllByRole, getByRole} = await render({
        onSelectionChange,
        selectedKey: "analytics" as CollectionKey,
      });

      expect(getByRole("tab", {selected: true})).toHaveTextContent("Analytics");

      press(getAllByRole("tab")[2]!);
      await nextTick();

      expect(onSelectionChange).toHaveBeenCalledWith("reports");
      // Controlled: the caller decides, so nothing moved on its own.
      expect(getByRole("tab", {selected: true})).toHaveTextContent("Analytics");
    });

    it("takes a numeric key", async () => {
      const {getByRole} = await render({
        items: [
          {id: 200, label: "200 mm"},
          {id: 100, label: "100 mm"},
        ],
      });

      expect(getByRole("tab", {selected: true})).toHaveTextContent("200 mm");
      expect(getByRole("tab", {selected: true}).id).toMatch(/-tab-200$/);
    });
  });

  describe("the keyboard", () => {
    it("chooses as it moves when activation is automatic", async () => {
      const {getAllByRole, getByRole} = await render();

      keydown(getAllByRole("tab")[0]!, "ArrowRight");
      await nextTick();

      expect(getByRole("tab", {selected: true})).toHaveTextContent("Analytics");
    });

    it("only moves focus when activation is manual", async () => {
      const {getAllByRole, getByRole} = await render({keyboardActivation: "manual"});
      const [overview, analytics] = getAllByRole("tab");

      keydown(overview!, "ArrowRight");
      await nextTick();

      expect(getByRole("tab", {selected: true})).toHaveTextContent("Overview");
      expect(analytics).toHaveFocus();

      keydown(analytics!, "Enter");
      await nextTick();

      expect(getByRole("tab", {selected: true})).toHaveTextContent("Analytics");
    });

    it("chooses on Space as well as Enter", async () => {
      const {getAllByRole, getByRole} = await render({keyboardActivation: "manual"});

      keydown(getAllByRole("tab")[2]!, " ");
      await nextTick();

      expect(getByRole("tab", {selected: true})).toHaveTextContent("Reports");
    });

    it("wraps at both ends", async () => {
      const {getAllByRole, getByRole} = await render();

      keydown(getAllByRole("tab")[0]!, "ArrowLeft");
      await nextTick();

      expect(getByRole("tab", {selected: true})).toHaveTextContent("Reports");

      keydown(getAllByRole("tab")[2]!, "ArrowRight");
      await nextTick();

      expect(getByRole("tab", {selected: true})).toHaveTextContent("Overview");
    });

    it("steps over a disabled tab", async () => {
      const {getAllByRole, getByRole} = await render({disabledKeys: ["analytics"]});

      keydown(getAllByRole("tab")[0]!, "ArrowRight");
      await nextTick();

      expect(getByRole("tab", {selected: true})).toHaveTextContent("Reports");
    });

    it("jumps to either end", async () => {
      const {getAllByRole, getByRole} = await render();

      keydown(getAllByRole("tab")[0]!, "End");
      await nextTick();

      expect(getByRole("tab", {selected: true})).toHaveTextContent("Reports");

      keydown(getAllByRole("tab")[2]!, "Home");
      await nextTick();

      expect(getByRole("tab", {selected: true})).toHaveTextContent("Overview");
    });

    it("leaves the block arrows to the page while horizontal", async () => {
      // React Aria hands a tab list a delegate that navigates only the axis the tabs run along.
      const {getAllByRole, getByRole} = await render();
      const event = keydown(getAllByRole("tab")[0]!, "ArrowDown");

      await nextTick();

      expect(event.defaultPrevented).toBe(false);
      expect(getByRole("tab", {selected: true})).toHaveTextContent("Overview");
    });

    it("answers the block arrows while vertical", async () => {
      const {getAllByRole, getByRole} = await render({orientation: "vertical"});

      keydown(getAllByRole("tab")[0]!, "ArrowDown");
      await nextTick();

      expect(getByRole("tab", {selected: true})).toHaveTextContent("Analytics");
    });

    it("leaves the paging keys to the page", async () => {
      // The tab list's delegate has no notion of a page at all.
      const {getAllByRole, getByRole} = await render();
      const event = keydown(getAllByRole("tab")[0]!, "PageDown");

      await nextTick();

      expect(event.defaultPrevented).toBe(false);
      expect(getByRole("tab", {selected: true})).toHaveTextContent("Overview");
    });

    it("leaves Escape to whatever the tabs sit inside", async () => {
      // A tab list never has an empty selection to clear, so claiming the key would swallow the
      // Escape that should close a surrounding overlay.
      const {getAllByRole} = await render();
      const event = keydown(getAllByRole("tab")[0]!, "Escape");

      await nextTick();

      expect(event.defaultPrevented).toBe(false);
    });
  });

  describe("the panels", () => {
    it("renders only the selected panel", async () => {
      const {container} = await render();
      const panels = container.querySelectorAll('[data-slot="tabs-panel"]');

      expect(panels).toHaveLength(1);
      expect(panels[0]).toHaveTextContent("Overview panel");
    });

    it("keeps every panel mounted and inert when told to force them", async () => {
      const {container} = await render({forceMountPanels: true});
      const panels = [...container.querySelectorAll('[data-slot="tabs-panel"]')];

      expect(panels).toHaveLength(3);
      expect(panels[0]).not.toHaveAttribute("data-inert");
      expect(panels[1]).toHaveAttribute("data-inert", "true");
      expect(panels[1]).toHaveAttribute("inert");
      expect(panels[1]).not.toHaveAttribute("tabindex");
    });
  });

  describe("the disabled tab list", () => {
    it("reports itself disabled and disables every tab", async () => {
      const {container, getAllByRole} = await render({isDisabled: true});

      expect(container.querySelector('[data-slot="tabs"]')).toHaveAttribute(
        "data-disabled",
        "true",
      );
      for (const tab of getAllByRole("tab")) {
        expect(tab).toHaveAttribute("aria-disabled", "true");
      }
    });

    it("does not select on press", async () => {
      const onSelectionChange = vi.fn();
      const {getAllByRole} = await render({isDisabled: true, onSelectionChange});

      press(getAllByRole("tab")[1]!);
      await nextTick();

      expect(onSelectionChange).not.toHaveBeenCalled();
    });
  });
});
