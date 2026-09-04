import type { CollectionKey } from "@/composables/use-collection";

import { renderInterop } from "@ropav/testing/helpers/vue";
import { describe, expect, it, vi } from "vitest";
import { h, nextTick } from "vue";

import {
  SegmentedControlIndicator,
  SegmentedControlItem,
  SegmentedControl,
} from "@/components/segmented-control";

interface Item {
  id: CollectionKey;
  label: string;
  isDisabled?: boolean;
}

const ITEMS: Item[] = [
  { id: "daily", label: "Daily" },
  { id: "weekly", label: "Weekly" },
  { id: "monthly", label: "Monthly" },
];

/**
 * The control mounted the way a consumer mounts it: from a VDOM host, with every part written in
 * the host and forwarded through the root's slot.
 *
 * Everything here is already covered by the Vapor suite, and that is the reason the file exists.
 * Content written in Vapor resolves `inject` against the component that renders it, so a
 * `provide` made anywhere inside is found; content written in a VDOM host resolves against the
 * host, so only what the wrapper itself provides is found. A segmented control hands its parts a
 * context, a per-segment context and a shared-element scope, and none of the three can go red in
 * the other suite.
 */
const renderSegmentedControl = (props: Record<string, unknown> = {}, items: Item[] = ITEMS) =>
  renderInterop(SegmentedControl, {
    props: { ariaLabel: "Range", ...props },
    slots: {
      default: () =>
        items.map((item) =>
          h(
            SegmentedControlItem,
            { id: item.id, isDisabled: item.isDisabled, key: item.id },
            { default: () => [item.label, h(SegmentedControlIndicator)] },
          ),
        ),
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

const press = (element: Element) =>
  element.dispatchEvent(
    new PointerEvent("pointerdown", { bubbles: true, button: 0, cancelable: true }),
  );

describe("SegmentedControl (interop)", () => {
  it("reaches every part written in the host with the shared styles", async () => {
    const { container, unmount } = renderSegmentedControl();

    await settle();

    expect(slot(container, "segmented-control")).toHaveClass("segmented-control");
    expect(slot(container, "segmented-control-item")).toHaveClass("segmented-control__item");
    expect(slot(container, "segmented-control-indicator")).toHaveClass(
      "segmented-control__indicator",
    );

    unmount();
  });

  it("registers segments written in the host into the collection", async () => {
    const { container, unmount } = renderSegmentedControl();

    await settle();

    const items = slots(container, "segmented-control-item");

    // A collection built from the host's own children: without the context reaching them, none
    // of these would be selectable and nothing would carry a tab index.
    expect(items).toHaveLength(3);
    expect(items[0]).toHaveAttribute("aria-checked", "true");
    expect(items[0]).toHaveAttribute("tabindex", "0");
    expect(items[1]).toHaveAttribute("tabindex", "-1");

    unmount();
  });

  it("reaches the per-segment context from an indicator written in the host", async () => {
    const { container, unmount } = renderSegmentedControl();

    await settle();

    const indicators = slots(container, "segmented-control-indicator");

    // The indicator learns whether it is selected from the segment that encloses it, which is
    // the one context a host-written tree resolves differently.
    expect(indicators).toHaveLength(1);
    expect(indicators[0]!.closest('[data-slot="segmented-control-item"]')).toHaveTextContent(
      "Daily",
    );

    unmount();
  });

  it("selects a host-written segment on press", async () => {
    const onSelectionChange = vi.fn();
    const { container, unmount } = renderSegmentedControl({ onSelectionChange });

    await settle();

    press(slots(container, "segmented-control-item")[1]!);
    await settle();

    expect(onSelectionChange).toHaveBeenCalledWith("weekly");
    expect(slots(container, "segmented-control-item")[1]).toHaveAttribute("aria-checked", "true");

    unmount();
  });

  it("moves the indicator to a host-written segment that takes the selection", async () => {
    const { container, unmount } = renderSegmentedControl();

    await settle();

    press(slots(container, "segmented-control-item")[2]!);
    await settle();

    const indicators = slots(container, "segmented-control-indicator");

    // One scope shared across host-written segments: the handoff would leave two indicators, or
    // none, if the scope did not reach them.
    expect(indicators).toHaveLength(1);
    expect(indicators[0]!.closest('[data-slot="segmented-control-item"]')).toHaveTextContent(
      "Monthly",
    );

    unmount();
  });

  it("navigates between host-written segments with the keyboard", async () => {
    const { container, unmount } = renderSegmentedControl();

    await settle();

    slots(container, "segmented-control-item")[0]!.dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "ArrowRight" }),
    );
    await settle();

    expect(slots(container, "segmented-control-item")[1]).toHaveAttribute("aria-checked", "true");

    unmount();
  });
});
