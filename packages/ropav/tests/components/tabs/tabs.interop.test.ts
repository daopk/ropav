import type { CollectionKey } from "@/composables/use-collection";

import { renderInterop } from "@ropav/testing/helpers/vue";
import { describe, expect, it, vi } from "vitest";
import { h, nextTick } from "vue";

import {
  TabsIndicator,
  TabsList,
  TabsListContainer,
  TabsPanel,
  Tabs,
  TabsSeparator,
  TabsTab,
} from "@/components/tabs";

interface Item {
  id: CollectionKey;
  label: string;
  isDisabled?: boolean;
}

const ITEMS: Item[] = [
  { id: "overview", label: "Overview" },
  { id: "analytics", label: "Analytics" },
  { id: "reports", label: "Reports" },
];

/**
 * The tabs mounted the way a consumer mounts them: from a VDOM host, with every part written in
 * the host and forwarded through the root's slot.
 *
 * Everything here is already covered by the Vapor suite, and that is the reason the file exists.
 * Content written in Vapor resolves `inject` against the component that renders it, so a
 * `provide` made anywhere inside is found; content written in a VDOM host resolves against the
 * host, so only what the wrapper itself provides is found. Tabs hand their parts a context, a
 * per-tab context and a shared-element scope, and none of the three can go red in the other suite.
 */
const renderTabs = (props: Record<string, unknown> = {}, items: Item[] = ITEMS) =>
  renderInterop(Tabs, {
    props,
    slots: {
      default: () => [
        h(TabsListContainer, null, {
          default: () =>
            h(
              TabsList,
              { ariaLabel: "Options" },
              {
                default: () =>
                  items.map((item) =>
                    h(
                      TabsTab,
                      { id: item.id, isDisabled: item.isDisabled, key: item.id },
                      { default: () => [h(TabsSeparator), item.label, h(TabsIndicator)] },
                    ),
                  ),
              },
            ),
        }),
        ...items.map((item) =>
          h(TabsPanel, { id: item.id, key: item.id }, { default: () => `${item.label} panel` }),
        ),
      ],
    },
  });

const slot = (container: HTMLElement, name: string) =>
  container.querySelector<HTMLElement>(`[data-slot="${name}"]`);

const slots = (container: HTMLElement, name: string) => [
  ...container.querySelectorAll<HTMLElement>(`[data-slot="${name}"]`),
];

const settle = async (ticks = 4) => {
  for (let index = 0; index < ticks; index += 1) await nextTick();
};

describe("Tabs (interop)", () => {
  it("reaches every part written in the host with the shared styles", async () => {
    const { container, unmount } = renderTabs();

    await settle();

    expect(slot(container, "tabs")).toHaveClass("rp-tabs");
    expect(slot(container, "tabs-list-container")).toHaveClass("rp-tabs__list-container");
    expect(slot(container, "tabs-list")).toHaveClass("rp-tabs__list");
    expect(slot(container, "tabs-tab")).toHaveClass("rp-tabs__tab");
    expect(slot(container, "tabs-separator")).toHaveClass("rp-tabs__separator");
    expect(slot(container, "tabs-panel")).toHaveClass("rp-tabs__panel");

    unmount();
  });

  it("registers tabs written in the host into the collection", async () => {
    const { container, unmount } = renderTabs();

    await settle();

    const tabs = slots(container, "tabs-tab");

    // A collection built from the host's own children: without the context reaching them, none
    // of these would be selectable and nothing would carry a tab index.
    expect(tabs).toHaveLength(3);
    expect(tabs[0]).toHaveAttribute("aria-selected", "true");
    expect(tabs[0]).toHaveAttribute("tabindex", "0");
    expect(tabs[1]).toHaveAttribute("tabindex", "-1");

    unmount();
  });

  it("reaches the per-tab context from an indicator written in the host", async () => {
    const { container, unmount } = renderTabs();

    await settle();

    const indicators = slots(container, "tabs-indicator");

    // The indicator learns whether it is selected from the tab that encloses it, which is the
    // one context a host-written tree resolves differently.
    expect(indicators).toHaveLength(1);
    expect(indicators[0]).toHaveClass("rp-tabs__indicator");
    expect(indicators[0]!.closest('[data-slot="tabs-tab"]')).toHaveTextContent("Overview");

    unmount();
  });

  it("ties a host-written tab to a host-written panel", async () => {
    const { container, unmount } = renderTabs();

    await settle();

    const tab = slot(container, "tabs-tab")!;
    const panel = slot(container, "tabs-panel")!;

    expect(tab.getAttribute("aria-controls")).toBe(panel.id);
    expect(panel.getAttribute("aria-labelledby")).toBe(tab.id);

    unmount();
  });

  it("selects a host-written tab on press", async () => {
    const onSelectionChange = vi.fn();
    const { container, unmount } = renderTabs({ onSelectionChange });

    await settle();

    slots(container, "tabs-tab")[1]!.dispatchEvent(
      new PointerEvent("pointerdown", { bubbles: true, button: 0, cancelable: true }),
    );
    await settle();

    expect(onSelectionChange).toHaveBeenCalledWith("analytics");
    expect(slots(container, "tabs-tab")[1]).toHaveAttribute("aria-selected", "true");
    expect(slot(container, "tabs-panel")).toHaveTextContent("Analytics panel");

    unmount();
  });

  it("moves the indicator to a host-written tab that takes the selection", async () => {
    const { container, unmount } = renderTabs();

    await settle();

    slots(container, "tabs-tab")[2]!.dispatchEvent(
      new PointerEvent("pointerdown", { bubbles: true, button: 0, cancelable: true }),
    );
    await settle();

    const indicators = slots(container, "tabs-indicator");

    // One scope shared across host-written tabs: the handoff would leave two indicators, or
    // none, if the scope did not reach them.
    expect(indicators).toHaveLength(1);
    expect(indicators[0]!.closest('[data-slot="tabs-tab"]')).toHaveTextContent("Reports");

    unmount();
  });

  it("navigates between host-written tabs with the keyboard", async () => {
    const { container, unmount } = renderTabs();

    await settle();

    slots(container, "tabs-tab")[0]!.dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "ArrowRight" }),
    );
    await settle();

    expect(slots(container, "tabs-tab")[1]).toHaveAttribute("aria-selected", "true");

    unmount();
  });

  it("works without a list container written in the host", async () => {
    const { container, unmount } = renderInterop(Tabs, {
      slots: {
        default: () => [
          h(
            TabsList,
            { ariaLabel: "Options" },
            {
              default: () =>
                ITEMS.map((item) =>
                  h(
                    TabsTab,
                    { id: item.id, key: item.id },
                    { default: () => [item.label, h(TabsIndicator)] },
                  ),
                ),
            },
          ),
        ],
      },
    });

    await settle();

    expect(slot(container, "tabs-list-container")).toBeNull();
    expect(slots(container, "tabs-tab")).toHaveLength(3);
    expect(slots(container, "tabs-indicator")).toHaveLength(1);

    unmount();
  });
});
