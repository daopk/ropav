import type { CollectionKey } from "@/composables/use-collection";

import { renderVapor } from "@ropav/testing/helpers/vue";
import { describe, expect, it, vi } from "vitest";
import { nextTick } from "vue";

import SegmentedControl from "./fixtures.vue";

/**
 * Mount the fixture and wait for the segments to register.
 *
 * The collection learns its members from the DOM, so everything derived from it — the fallback
 * selection, the roving tab index, the indicator's place — settles a tick after the first render.
 */
const render = async (props: Record<string, unknown> = {}) => {
  const rendered = renderVapor(SegmentedControl, { props });

  await nextTick();
  await nextTick();

  return rendered;
};

const settle = async (ticks = 4) => {
  for (let index = 0; index < ticks; index += 1) await nextTick();
};

const keydown = (element: Element, key: string, init: KeyboardEventInit = {}) => {
  const event = new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key, ...init });

  element.dispatchEvent(event);

  return event;
};

const press = (element: Element) => {
  element.dispatchEvent(
    new PointerEvent("pointerdown", { bubbles: true, button: 0, cancelable: true }),
  );
};

const itemsIn = (container: HTMLElement) => [
  ...container.querySelectorAll<HTMLElement>('[data-slot="segmented-control-item"]'),
];

const selectedKeyIn = (container: HTMLElement) =>
  container
    .querySelector('[data-slot="segmented-control-item"][data-selected="true"]')
    ?.getAttribute("data-key");

describe("SegmentedControl", () => {
  describe("structure", () => {
    it("exposes the data slots and the BEM blocks", async () => {
      const { container } = await render();
      const root = container.querySelector('[data-slot="segmented-control"]')!;

      expect(root.className).toContain("segmented-control");
      expect(itemsIn(container)).toHaveLength(3);
      expect(itemsIn(container)[0]!.className).toContain("segmented-control__item");
      expect(
        container.querySelector('[data-slot="segmented-control-indicator"]')!.className,
      ).toContain("segmented-control__indicator");
    });

    it("renders the size and full-width modifiers on the root", async () => {
      const { container } = await render({ fullWidth: true, size: "lg" });
      const root = container.querySelector('[data-slot="segmented-control"]')!;

      expect(root.className).toContain("segmented-control--lg");
      expect(root.className).toContain("segmented-control--full-width");
    });

    it("takes the default size without a caller saying so", async () => {
      const { container } = await render();

      expect(container.querySelector('[data-slot="segmented-control"]')!.className).toContain(
        "segmented-control--md",
      );
    });

    it("composes a caller's class onto the root", async () => {
      const { container } = await render({ class: "mt-4" });
      const root = container.querySelector('[data-slot="segmented-control"]')!;

      expect(root.className).toContain("segmented-control");
      expect(root.className).toContain("mt-4");
    });

    it("names each segment with data-key rather than an id", async () => {
      const { container } = await render();
      const [first] = itemsIn(container);

      expect(first!.getAttribute("data-key")).toBe("daily");
      // The key must not reach the DOM as an id, or two controls holding the same key collide.
      expect(first!.id).toBe("");
    });
  });

  describe("accessibility", () => {
    it("reports itself as a radio group of radios", async () => {
      const { container } = await render();
      const root = container.querySelector('[data-slot="segmented-control"]')!;

      expect(root.getAttribute("role")).toBe("radiogroup");
      expect(root.getAttribute("aria-orientation")).toBe("horizontal");
      expect(itemsIn(container).every((item) => item.getAttribute("role") === "radio")).toBe(true);
    });

    it("checks exactly one segment", async () => {
      const { container } = await render();
      const checked = itemsIn(container).filter(
        (item) => item.getAttribute("aria-checked") === "true",
      );

      expect(checked).toHaveLength(1);
      expect(checked[0]!.getAttribute("data-key")).toBe("daily");
    });

    it("never submits the form it sits in", async () => {
      const { container } = await render();

      expect(itemsIn(container).every((item) => item.getAttribute("type") === "button")).toBe(true);
    });

    it("carries the names and descriptions the caller gives it", async () => {
      const { container } = await render({
        ariaDescribedby: "help",
        ariaLabel: "Reporting range",
      });
      const root = container.querySelector('[data-slot="segmented-control"]')!;

      expect(root.getAttribute("aria-label")).toBe("Reporting range");
      expect(root.getAttribute("aria-describedby")).toBe("help");
    });
  });

  describe("selection", () => {
    it("selects the first segment, reporting nothing as changed", async () => {
      const onSelectionChange = vi.fn();
      const { container } = await render({ onSelectionChange });

      expect(selectedKeyIn(container)).toBe("daily");
      // Resolving the fallback is a read, not a write.
      expect(onSelectionChange).not.toHaveBeenCalled();
    });

    it("skips a first segment that is disabled", async () => {
      const { container } = await render({ disabledKeys: ["daily"] });

      expect(selectedKeyIn(container)).toBe("weekly");
    });

    it("honours an explicit default", async () => {
      const { container } = await render({ defaultSelectedKey: "monthly" });

      expect(selectedKeyIn(container)).toBe("monthly");
    });

    it("selects on press and reports it down all three paths, once each", async () => {
      const onSelectionChange = vi.fn();
      const onSelectionChangeEvent = vi.fn();
      const onUpdateSelectedKeyEvent = vi.fn();
      const { container } = await render({
        onSelectionChange,
        onSelectionChangeEvent,
        onUpdateSelectedKeyEvent,
      });

      press(itemsIn(container)[2]!);
      await settle();

      expect(selectedKeyIn(container)).toBe("monthly");
      // Declaring `onSelectionChange` as a prop takes it out of the emit listener lookup, so
      // the callback and the event of the same name stay one report each rather than two.
      expect(onSelectionChange.mock.calls).toEqual([["monthly"]]);
      expect(onSelectionChangeEvent.mock.calls).toEqual([["monthly"]]);
      expect(onUpdateSelectedKeyEvent.mock.calls).toEqual([["monthly"]]);
    });

    it("stays put while the caller drives it", async () => {
      const onSelectionChange = vi.fn();
      const { container } = await render({ onSelectionChange, selectedKey: "weekly" });

      expect(selectedKeyIn(container)).toBe("weekly");

      press(itemsIn(container)[2]!);
      await settle();

      expect(selectedKeyIn(container)).toBe("weekly");
      expect(onSelectionChange).toHaveBeenCalledWith("monthly");
    });

    it("refuses a disabled segment", async () => {
      const { container } = await render({ disabledKeys: ["monthly"] });

      press(itemsIn(container)[2]!);
      await settle();

      expect(selectedKeyIn(container)).toBe("daily");
    });
  });

  describe("the tab stop", () => {
    it("gives the selected segment the only tab stop", async () => {
      const { container } = await render();
      const tabIndexes = itemsIn(container).map((item) => item.getAttribute("tabindex"));

      expect(tabIndexes).toEqual(["0", "-1", "-1"]);
    });

    it("leaves a disabled segment out of the tab order entirely", async () => {
      const { container } = await render({ disabledKeys: ["monthly"] });

      expect(itemsIn(container)[2]!.hasAttribute("tabindex")).toBe(false);
    });
  });

  describe("the keyboard", () => {
    it("moves focus and the selection together along the row", async () => {
      const { container } = await render();
      const items = itemsIn(container);

      items[0]!.focus();
      keydown(items[0]!, "ArrowRight");
      await settle();

      expect(selectedKeyIn(container)).toBe("weekly");
      expect(document.activeElement).toBe(items[1]);
    });

    it("answers the block arrows too, unlike a tab list", async () => {
      const { container } = await render();
      const items = itemsIn(container);

      items[0]!.focus();
      keydown(items[0]!, "ArrowDown");
      await settle();

      expect(selectedKeyIn(container)).toBe("weekly");

      keydown(items[1]!, "ArrowUp");
      await settle();

      expect(selectedKeyIn(container)).toBe("daily");
    });

    it("wraps at both ends", async () => {
      const { container } = await render();
      const items = itemsIn(container);

      items[0]!.focus();
      keydown(items[0]!, "ArrowLeft");
      await settle();

      expect(selectedKeyIn(container)).toBe("monthly");
    });

    it("steps over a disabled segment", async () => {
      const { container } = await render({ disabledKeys: ["weekly"] });
      const items = itemsIn(container);

      items[0]!.focus();
      keydown(items[0]!, "ArrowRight");
      await settle();

      expect(selectedKeyIn(container)).toBe("monthly");
    });

    it("jumps to either end", async () => {
      const { container } = await render();
      const items = itemsIn(container);

      items[0]!.focus();
      keydown(items[0]!, "End");
      await settle();

      expect(selectedKeyIn(container)).toBe("monthly");

      keydown(items[2]!, "Home");
      await settle();

      expect(selectedKeyIn(container)).toBe("daily");
    });

    it("selects the focused segment on Enter and on Space", async () => {
      const { container } = await render();
      const items = itemsIn(container);

      items[2]!.focus();
      keydown(items[2]!, "Enter");
      await settle();

      expect(selectedKeyIn(container)).toBe("monthly");

      items[1]!.focus();
      keydown(items[1]!, " ");
      await settle();

      expect(selectedKeyIn(container)).toBe("weekly");
    });

    it("leaves paging to the page", async () => {
      const { container } = await render();
      const items = itemsIn(container);

      items[0]!.focus();
      const event = keydown(items[0]!, "PageDown");

      await settle();

      expect(event.defaultPrevented).toBe(false);
      expect(selectedKeyIn(container)).toBe("daily");
    });

    it("leaves Escape to whatever the control sits inside", async () => {
      const { container } = await render();
      const items = itemsIn(container);

      items[0]!.focus();
      const event = keydown(items[0]!, "Escape");

      await settle();

      expect(event.defaultPrevented).toBe(false);
      expect(selectedKeyIn(container)).toBe("daily");
    });
  });

  describe("the indicator", () => {
    it("renders only inside the selected segment", async () => {
      const { container } = await render();
      const indicators = container.querySelectorAll('[data-slot="segmented-control-indicator"]');

      expect(indicators).toHaveLength(1);
      expect(indicators[0]!.closest("[data-key]")!.getAttribute("data-key")).toBe("daily");
    });

    it("moves with the selection", async () => {
      const { container } = await render();

      press(itemsIn(container)[2]!);
      await settle();

      const indicators = container.querySelectorAll('[data-slot="segmented-control-indicator"]');

      expect(indicators).toHaveLength(1);
      expect(indicators[0]!.closest("[data-key]")!.getAttribute("data-key")).toBe("monthly");
    });

    it("starts inside a segment that is not the first", async () => {
      const { container } = await render({ defaultSelectedKey: "weekly" });
      const indicator = container.querySelector('[data-slot="segmented-control-indicator"]')!;

      expect(indicator.closest("[data-key]")!.getAttribute("data-key")).toBe("weekly");
    });
  });

  describe("the separator", () => {
    it("is opt-in", async () => {
      const { container } = await render();

      expect(container.querySelectorAll('[data-slot="segmented-control-separator"]')).toHaveLength(
        0,
      );
    });

    it("renders one inside every segment, hidden from assistive technology", async () => {
      const { container } = await render({ withSeparator: true });
      const separators = [
        ...container.querySelectorAll('[data-slot="segmented-control-separator"]'),
      ];

      expect(separators).toHaveLength(3);
      expect(separators[0]!.className).toContain("segmented-control__separator");
      expect(
        separators.every((separator) => separator.getAttribute("aria-hidden") === "true"),
      ).toBe(true);
    });
  });

  describe("a disabled control", () => {
    it("reports itself and every segment as disabled", async () => {
      const { container } = await render({ isDisabled: true });
      const root = container.querySelector('[data-slot="segmented-control"]')!;

      expect(root.getAttribute("data-disabled")).toBe("true");
      expect(root.getAttribute("aria-disabled")).toBe("true");
      expect(itemsIn(container).every((item) => item.hasAttribute("disabled"))).toBe(true);
    });

    it("does not move the selection on a press", async () => {
      const { container } = await render({ isDisabled: true });

      press(itemsIn(container)[2]!);
      await settle();

      expect(selectedKeyIn(container)).toBe("daily");
    });
  });

  it("registers segments that are keyed by number", async () => {
    const items: { id: CollectionKey; label: string }[] = [
      { id: 1, label: "One" },
      { id: 2, label: "Two" },
    ];
    const { container } = await render({ items });

    expect(selectedKeyIn(container)).toBe("1");

    press(itemsIn(container)[1]!);
    await settle();

    expect(selectedKeyIn(container)).toBe("2");
  });
});
