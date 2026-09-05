import { expectNoA11yViolations } from "@ropav/testing/helpers/a11y";
import { renderVapor } from "@ropav/testing/helpers/vue";
import { describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { nextTick } from "vue";

import { parkPointer } from "../../harness/park-pointer";

import Fixture from "./fixtures.vue";

const render = async (props: Record<string, unknown> = {}) => {
  const result = renderVapor(Fixture, { props });

  await nextTick();

  const listbox = result.container.querySelector('[data-slot="list-box"]')!;

  return {
    ...result,
    items: () => [...listbox.querySelectorAll<HTMLElement>('[role="option"]')],
    listbox,
  };
};

/**
 * Everything here needs a real layout or a real stylesheet: the `:has()` rule that makes room for
 * the indicator, the focus ring the CSS paints with a shadow rather than an outline, and the
 * spacing the listbox gets from adjacent-sibling margins instead of a flex gap.
 */
describe("ListBox (browser)", () => {
  it("makes room for the indicator only while it is drawing a checkmark", async () => {
    const withIndicator = await render({
      defaultSelectedKeys: ["1"],
      selectionMode: "single",
      withIndicator: true,
    });
    const withoutIndicator = await render({ defaultSelectedKeys: ["1"], selectionMode: "single" });
    const [selected, unselected] = withIndicator.items();

    // `.rp-list-box-item[aria-selected="true"]:has(.rp-list-box-item__indicator)` is the rule under test;
    // it cannot resolve without the real stylesheet. The indicator is absolute and holds its
    // checkmark hidden until the option is selected, so an unselected one keeps the full width for
    // its label.
    expect(getComputedStyle(selected!).paddingInlineEnd).toBe("28px");
    expect(getComputedStyle(unselected!).paddingInlineEnd).toBe("8px");
    expect(getComputedStyle(withoutIndicator.items()[0]!).paddingInlineEnd).toBe("8px");

    withIndicator.unmount();
    withoutIndicator.unmount();
  });

  it("paints the focus ring with a shadow rather than an outline", async () => {
    const { items, unmount } = await render({ selectionMode: "single" });
    const item = items()[0]!;

    item.setAttribute("data-focus-visible", "true");

    const styles = getComputedStyle(item);

    // `status-focused` draws the ring with a ring shadow and explicitly turns the outline off, so
    // asserting on `outlineWidth` would pass while showing nothing.
    expect(styles.boxShadow).not.toBe("none");
    expect(styles.outlineStyle).toBe("none");

    unmount();
  });

  it("spaces the items without a flex gap", async () => {
    // The listbox deliberately avoids flex so a virtualiser's explicit content height survives;
    // the spacing comes from an adjacent-sibling margin instead.
    const { items, unmount } = await render();
    const [first, second] = items();

    expect(getComputedStyle(first!).marginTop).toBe("0px");
    expect(getComputedStyle(second!).marginTop).toBe("4px");
    expect(second!.getBoundingClientRect().top - first!.getBoundingClientRect().bottom).toBe(4);

    unmount();
  });

  it("transitions the checkmark rather than swapping it", async () => {
    const { items, unmount } = await render({ selectionMode: "single", withIndicator: true });
    const item = items()[0]!;

    item.click();
    await nextTick();

    const check = item.querySelector('[data-slot="list-box-item-indicator--checkmark"]')!;
    const styles = getComputedStyle(check);

    // The stylesheet also carries a `stroke-dashoffset`-specific rule, but it is nested inside
    // `.rp-list-box-item__indicator` and so asks for a `.rp-list-box-item` *within* the indicator — a
    // selector nothing can satisfy. What actually applies is the blanket transition, in the React
    // build as much as this one, so that is what is pinned here.
    expect(styles.transitionProperty).toBe("all");
    expect(styles.transitionDuration).toBe("0.3s");

    unmount();
  });

  /**
   * The jsdom suite selects by dispatching a click on the option, which proves the handler runs
   * but not that a pointer can reach it. A real press moves the pointer onto the option first, and
   * the hover that follows re-renders it; in vapor a re-render re-attaches every listener that
   * arrived through `v-bind`, which reorders them and can drop one while the event is still in
   * flight. Selection re-renders the option again, mid-dispatch, for the same reason.
   *
   * The pointer is parked first because it belongs to the page: an option left under it by an
   * earlier test would never see the pointer arrive, and the press would skip both re-renders.
   */
  it("selects an item on a press from the pointer itself", async () => {
    await parkPointer();

    const onSelectionChange = vi.fn();
    const { items, unmount } = await render({ onSelectionChange, selectionMode: "single" });

    await userEvent.click(items()[1]!);
    await nextTick();

    expect(onSelectionChange).toHaveBeenCalledOnce();
    expect(items()[1]).toHaveAttribute("data-selected", "true");

    unmount();
  });

  it("moves the selection with the pointer across two presses", async () => {
    // The second press starts from the first option rather than from nowhere, so the pointer
    // crosses out of one option and into another while both are re-rendering.
    await parkPointer();

    const { items, unmount } = await render({ selectionMode: "single" });

    await userEvent.click(items()[0]!);
    await nextTick();
    await userEvent.click(items()[2]!);
    await nextTick();

    expect(items()[0]).not.toHaveAttribute("data-selected");
    expect(items()[2]).toHaveAttribute("data-selected", "true");

    unmount();
  });

  it("has no accessibility violations, sections and all", async () => {
    const { container, unmount } = await render({ selectionMode: "multiple", withSections: true });

    await expectNoA11yViolations(container);

    unmount();
  });
});
