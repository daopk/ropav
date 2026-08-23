import {expectNoA11yViolations} from "@heroui/testing/helpers/a11y";
import {renderVapor} from "@heroui/testing/helpers/vue";
import {describe, expect, it} from "vitest";
import {nextTick} from "vue";

import Fixture from "./fixtures.vue";

const render = async (props: Record<string, unknown> = {}) => {
  const result = renderVapor(Fixture, {props});

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
  it("makes room for the indicator only when one is present", async () => {
    const withIndicator = await render({selectionMode: "single", withIndicator: true});
    const withoutIndicator = await render({selectionMode: "single"});

    // `.list-box-item:has(.list-box-item__indicator)` is the rule under test; it cannot resolve
    // without the real stylesheet.
    expect(getComputedStyle(withIndicator.items()[0]!).paddingInlineEnd).toBe("28px");
    expect(getComputedStyle(withoutIndicator.items()[0]!).paddingInlineEnd).toBe("8px");

    withIndicator.unmount();
    withoutIndicator.unmount();
  });

  it("paints the focus ring with a shadow rather than an outline", async () => {
    const {items, unmount} = await render({selectionMode: "single"});
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
    const {items, unmount} = await render();
    const [first, second] = items();

    expect(getComputedStyle(first!).marginTop).toBe("0px");
    expect(getComputedStyle(second!).marginTop).toBe("4px");
    expect(second!.getBoundingClientRect().top - first!.getBoundingClientRect().bottom).toBe(4);

    unmount();
  });

  it("transitions the checkmark rather than swapping it", async () => {
    const {items, unmount} = await render({selectionMode: "single", withIndicator: true});
    const item = items()[0]!;

    item.click();
    await nextTick();

    const check = item.querySelector('[data-slot="list-box-item-indicator--checkmark"]')!;
    const styles = getComputedStyle(check);

    // The stylesheet also carries a `stroke-dashoffset`-specific rule, but it is nested inside
    // `.list-box-item__indicator` and so asks for a `.list-box-item` *within* the indicator — a
    // selector nothing can satisfy. What actually applies is the blanket transition, in the React
    // build as much as this one, so that is what is pinned here.
    expect(styles.transitionProperty).toBe("all");
    expect(styles.transitionDuration).toBe("0.3s");

    unmount();
  });

  it("has no accessibility violations, sections and all", async () => {
    const {container, unmount} = await render({selectionMode: "multiple", withSections: true});

    await expectNoA11yViolations(container);

    unmount();
  });
});
