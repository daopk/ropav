import { PALETTE_CONTRAST_DEBT, expectNoA11yViolations } from "@ropav/testing/helpers/a11y";
import { renderVapor } from "@ropav/testing/helpers/vue";
import { describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { nextTick } from "vue";

import { parkPointer } from "../../harness/park-pointer";
import { settled } from "../../harness/settle";

import Fixture from "./stateful-fixtures.vue";

const renderPagination = (props: Record<string, unknown> = {}) => {
  const result = renderVapor(Fixture, { props });
  const nav = result.container.querySelector("nav")!;

  return {
    ...result,
    links: [...nav.querySelectorAll<HTMLButtonElement>('[data-slot="pagination-link"]')],
    nav,
    next: nav.querySelector<HTMLButtonElement>('[data-slot="pagination-next"]')!,
    previous: nav.querySelector<HTMLButtonElement>('[data-slot="pagination-previous"]')!,
  };
};

/**
 * Pagination is the one control in this library whose press changes the control being pressed:
 * choosing a page re-renders the whole strip, including the button still under the finger. So the
 * re-render lands mid-dispatch, which is where vapor is at its most fragile — every listener that
 * arrived through `v-bind` is re-attached on a render, and `pagination-link.vue` avoids that by
 * binding each handler in the template by hand. Nothing proves the avoidance works until a real
 * pointer drives it: `dispatchEvent(new PointerEvent(...))`, which is what the jsdom suite uses,
 * never crosses onto the element and so never triggers the hover render this is about.
 *
 * Every case parks the pointer first. It belongs to the page rather than to the test, so a button
 * left under it by an earlier file would never see the pointer arrive.
 */
describe("Pagination (browser)", () => {
  it("moves the page on a press from the pointer itself", async () => {
    await parkPointer();

    const onPageChange = vi.fn();
    const { links, unmount } = renderPagination({ onPageChange });

    expect(links[0]).toHaveAttribute("aria-current", "page");

    await userEvent.click(links[2]!);
    await nextTick();

    expect(onPageChange).toHaveBeenCalledWith(3);
    // The strip re-rendered under the pointer, and the marker moved with it.
    expect(links[2]).toHaveAttribute("aria-current", "page");
    expect(links[0]).not.toHaveAttribute("aria-current");

    unmount();
  });

  it("keeps answering the pointer after the press that re-rendered it", async () => {
    await parkPointer();

    const onPageChange = vi.fn();
    const { links, unmount } = renderPagination({ onPageChange });

    // The first press is the one that re-renders the button mid-dispatch. If that render drops a
    // listener, it is the second press — with the pointer already resting on the strip — that goes
    // missing, and a test asserting only the first would never see it.
    await userEvent.click(links[1]!);
    await nextTick();
    await userEvent.click(links[2]!);
    await nextTick();

    expect(onPageChange).toHaveBeenNthCalledWith(1, 2);
    expect(onPageChange).toHaveBeenNthCalledWith(2, 3);

    unmount();
  });

  it("releases the press on the button the render changed underneath", async () => {
    await parkPointer();

    const { links, unmount } = renderPagination();
    const link = links[1]!;

    await userEvent.hover(link);
    await nextTick();

    expect(link.matches(":hover")).toBe(true);
    expect(link).toHaveAttribute("data-hovered", "true");

    await userEvent.click(link);
    await nextTick();

    // The button became the active page during its own press. The press is over; the hover is not,
    // because the pointer never left.
    expect(link).toHaveAttribute("data-active", "true");
    expect(link).not.toHaveAttribute("data-pressed");
    expect(link).toHaveAttribute("data-hovered", "true");

    unmount();
  });

  it("paints the active page differently from its neighbours", async () => {
    await parkPointer();

    const { links, unmount } = renderPagination();

    await settled(links[0]!);

    // Proves the compiled stylesheet is loaded here and that `data-active` is what selects the
    // treatment — the attribute exists in jsdom too, but nothing there paints from it.
    expect(links[0]).toHaveClass("pagination__link");
    expect(getComputedStyle(links[0]!).backgroundColor).not.toBe(
      getComputedStyle(links[1]!).backgroundColor,
    );

    unmount();
  });

  it("walks the strip with the keyboard and activates on Enter and Space", async () => {
    await parkPointer();

    const onPageChange = vi.fn();
    const { links, next, previous, unmount } = renderPagination({ onPageChange });

    // Page one, so Previous is disabled and the strip's tab order starts at the first link.
    expect(previous.disabled).toBe(true);

    // Focus is placed rather than tabbed into, so the case asserts the order *within* the strip
    // rather than that the strip is the only tabbable thing on a page every browser test shares.
    links[0]!.focus();

    await userEvent.keyboard("{Tab}{Tab}");
    await nextTick();

    expect(links[2]).toHaveFocus();

    // Native button activation, which only a real browser performs.
    await userEvent.keyboard("{Enter}");
    await nextTick();

    expect(onPageChange).toHaveBeenNthCalledWith(1, 3);
    expect(next.disabled).toBe(true);

    await userEvent.keyboard(" ");
    await nextTick();

    expect(onPageChange).toHaveBeenNthCalledWith(2, 3);

    unmount();
  });

  it("takes a disabled step out of the pointer's reach through the stylesheet", async () => {
    await parkPointer();

    const { previous, unmount } = renderPagination();

    expect(previous.disabled).toBe(true);
    // `:disabled` is what dims and blocks it; there is no handler involved, so only a real cascade
    // shows it.
    expect(getComputedStyle(previous).pointerEvents).toBe("none");
    expect(Number(getComputedStyle(previous).opacity)).toBeLessThan(1);

    await userEvent.keyboard("{Tab}");
    await nextTick();

    expect(previous).not.toHaveFocus();

    unmount();
  });

  it("has no axe violations, on the page it starts on or the one it moves to", async () => {
    const { container, links, unmount } = renderPagination();

    await expectNoA11yViolations(container, PALETTE_CONTRAST_DEBT);

    links[2]!.click();
    await nextTick();

    // `aria-current="page"` moves between siblings, and the landmark's name has to survive it.
    await expectNoA11yViolations(container, PALETTE_CONTRAST_DEBT);

    unmount();
  });
});
