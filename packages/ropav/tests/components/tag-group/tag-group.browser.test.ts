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

  const group = result.container.querySelector('[data-slot="tag-group"]')!;

  return {
    ...result,
    group,
    list: group.querySelector('[data-slot="tag-group-list"]')!,
    tags: () => [...group.querySelectorAll<HTMLElement>('[data-slot="tag"]')],
  };
};

/**
 * The grid a tag group renders is only safe because the cell is taken out of the layout, and that
 * is exactly the kind of claim a real layout has to settle. The same goes for the wrapping the
 * list relies on and for the focus ring, which the stylesheet paints with a shadow.
 */
describe("TagGroup (browser)", () => {
  it("keeps the row's cell out of the layout", async () => {
    const { tags, unmount } = await render();
    const tag = tags()[0]!;
    const cell = tag.querySelector<HTMLElement>('[role="gridcell"]')!;

    // With anything but `contents` the cell would become the tag's only flex child and the icon,
    // label and remove button would stop laying out against the tag itself.
    expect(getComputedStyle(cell).display).toBe("contents");
    expect(cell.getBoundingClientRect().width).toBe(0);
    expect(getComputedStyle(tag).display).toBe("flex");

    unmount();
  });

  it("lets the content lay out directly against the tag", async () => {
    const onRemove = vi.fn();
    const { tags, unmount } = await render({ onRemove });
    const tag = tags()[0]!;
    const button = tag.querySelector<HTMLElement>('[data-slot="tag-remove-button"]')!;

    // The gap belongs to the tag, so it has to separate the label from the button even though a
    // cell sits between them in the tree.
    expect(getComputedStyle(tag).columnGap).toBe("4px");
    expect(button.getBoundingClientRect().height).toBeGreaterThan(0);
    expect(tag.getBoundingClientRect().height).toBe(24);

    unmount();
  });

  it("wraps its tags rather than overflowing", async () => {
    const { list, unmount } = await render({ tags: ["News", "Travel", "Gaming", "Shopping"] });

    expect(getComputedStyle(list).flexWrap).toBe("wrap");
    expect(getComputedStyle(list).gap).toBe("6px");

    unmount();
  });

  it("paints the focus ring with a shadow rather than an outline", async () => {
    const { tags, unmount } = await render();
    const tag = tags()[0]!;

    tag.setAttribute("data-focus-visible", "true");

    expect(getComputedStyle(tag).boxShadow).not.toBe("none");

    unmount();
  });

  /**
   * Two pressables share a tag — the tag itself, which selects, and the remove button nested
   * inside it — and the jsdom suite reaches both by dispatching a click. That cannot see the
   * shape a real press has: the pointer moves onto the tag first, and the hover it reports
   * re-renders it; in vapor a re-render re-attaches every listener that arrived through `v-bind`,
   * which reorders them and can drop one mid-dispatch. A press on the remove button crosses the
   * tag on the way in, so it re-renders the very element whose listener has to stay ahead.
   *
   * The pointer is parked first: a tag left under it by an earlier test would never see the
   * pointer arrive, and the press would skip the re-render this is here to survive.
   */
  it("selects a tag on a press from the pointer itself", async () => {
    await parkPointer();

    const onSelectionChange = vi.fn();
    const { tags, unmount } = await render({ onSelectionChange, selectionMode: "single" });

    await userEvent.click(tags()[1]!);
    await nextTick();

    expect(onSelectionChange).toHaveBeenCalledOnce();
    expect(tags()[1]).toHaveAttribute("data-selected", "true");

    unmount();
  });

  it("removes a tag on a press from the pointer itself", async () => {
    await parkPointer();

    const onRemove = vi.fn();
    const { tags, unmount } = await render({ onRemove });
    const remove = tags()[1]!.querySelector<HTMLElement>('[data-slot="tag-remove-button"]')!;

    await userEvent.click(remove);
    await nextTick();

    expect(onRemove).toHaveBeenCalledOnce();

    unmount();
  });

  it("has no accessibility violations as a grid of rows and cells", async () => {
    // A grid with rows and cells is exactly the structure axe checks hardest, so this is where the
    // role nesting earns its keep.
    const onRemove = vi.fn();
    const { container, unmount } = await render({
      onRemove,
      selectionMode: "multiple",
      withLabel: true,
    });

    await expectNoA11yViolations(container);

    unmount();
  });
});
