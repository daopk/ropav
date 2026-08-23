import { expectNoA11yViolations } from "@ropav/testing/helpers/a11y";
import { renderVapor } from "@ropav/testing/helpers/vue";
import { afterEach, describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { nextTick } from "vue";

import Fixture from "./fixtures.vue";

const mounted: { unmount: () => void }[] = [];

const renderSearchField = (props: Record<string, unknown> = {}) => {
  const result = renderVapor(Fixture, { props });

  mounted.push(result);

  return result;
};

const slot = (container: HTMLElement, name: string) =>
  container.querySelector<HTMLElement>(`[data-slot='${name}']`)!;

/**
 * Tear down whatever is still mounted, including after a failure.
 *
 * Every case here also unmounts itself, which is enough while they pass — but a case that throws
 * never reaches that line, and what it leaves behind is a field in the document that may still hold
 * focus. The next case to read `document.activeElement` then finds the *previous* case's control and
 * fails for a reason that has nothing to do with it, which is how one broken assertion here reads as
 * two.
 */
afterEach(() => {
  while (mounted.length > 0) {
    try {
      mounted.pop()!.unmount();
    } catch {
      // Already unmounted by the case itself, which is the normal path.
    }
  }
});

/**
 * The parts of a search field only a real browser can show: the `:has()` rules that shape the
 * control around the icon and the clear button, the hover fill the stylesheet suppresses while
 * focus is inside, and the clear button being reachable by a real pointer only while there is
 * something to clear.
 */
describe("SearchField (browser)", () => {
  it("strips the leading radius and padding off the control beside the icon", async () => {
    const bare = renderSearchField({ withSearchIcon: false });
    const barePadding = getComputedStyle(
      slot(bare.container, "search-field-input"),
    ).paddingInlineStart;

    bare.unmount();

    const withIcon = renderSearchField();
    const style = getComputedStyle(slot(withIcon.container, "search-field-input"));

    expect(style.borderStartStartRadius).toBe("0px");
    expect(style.paddingInlineStart).not.toBe(barePadding);

    withIcon.unmount();
  });

  it("strips the trailing radius and padding off the control beside the clear button", async () => {
    // Reached through `.search-field__group:has([slot="clear"])`, so it only fires while the
    // literal `slot` attribute is on the button.
    const bare = renderSearchField({ withClearButton: false });
    const barePadding = getComputedStyle(
      slot(bare.container, "search-field-input"),
    ).paddingInlineEnd;

    bare.unmount();

    const withClear = renderSearchField();
    const style = getComputedStyle(slot(withClear.container, "search-field-input"));

    expect(style.borderStartEndRadius).toBe("0px");
    expect(style.paddingInlineEnd).not.toBe(barePadding);

    withClear.unmount();
  });

  it("hides the clear button while there is nothing to clear", async () => {
    // `.search-field[data-empty="true"]` is what does it, and it takes the button out of
    // hit-testing as well as out of sight.
    const { container, unmount } = renderSearchField();
    const clearButton = slot(container, "search-field-clear-button");
    const style = getComputedStyle(clearButton);

    expect(style.opacity).toBe("0");
    expect(style.pointerEvents).toBe("none");

    unmount();
  });

  it("shows the clear button once there is something to clear", async () => {
    const { container, unmount } = renderSearchField();
    const control = container.querySelector<HTMLInputElement>("input")!;
    const clearButton = slot(container, "search-field-clear-button");

    await userEvent.click(control);
    await userEvent.keyboard("shoes");
    await nextTick();

    expect(getComputedStyle(clearButton).opacity).toBe("1");
    expect(getComputedStyle(clearButton).pointerEvents).not.toBe("none");

    unmount();
  });

  it("empties the field when a real pointer presses the clear button", async () => {
    // The whole point of covering this with a real pointer: the press arrives from a responder
    // handed down by the field, and a listener reaching a vapor element through `v-bind` is
    // dropped mid-dispatch — which only a real pointer reproduces.
    const { container, unmount } = renderSearchField({ defaultValue: "shoes" });
    const control = container.querySelector<HTMLInputElement>("input")!;

    await userEvent.click(slot(container, "search-field-clear-button"));
    await nextTick();

    expect(control.value).toBe("");

    unmount();
  });

  it("leaves focus in the control after the clear button is pressed", async () => {
    // Focus is taken back on the way down, so touching the button never folds the on-screen
    // keyboard away — and never strands focus on a button that `data-empty` just made
    // invisible and unhittable.
    const { container, unmount } = renderSearchField({ defaultValue: "shoes" });
    const control = container.querySelector<HTMLInputElement>("input")!;

    await userEvent.click(slot(container, "search-field-clear-button"));
    await nextTick();

    expect(document.activeElement).toBe(control);

    unmount();
  });

  it("empties the field on a real Escape press", async () => {
    const { container, unmount } = renderSearchField({ defaultValue: "shoes" });
    const control = container.querySelector<HTMLInputElement>("input")!;

    await userEvent.click(control);
    await userEvent.keyboard("{Escape}");
    await nextTick();

    expect(control.value).toBe("");

    unmount();
  });

  it("keeps the clear button out of the tab order", async () => {
    const { container, unmount } = renderSearchField({ defaultValue: "shoes" });
    const control = container.querySelector<HTMLInputElement>("input")!;
    const clearButton = slot(container, "search-field-clear-button");

    await userEvent.click(control);
    await userEvent.tab();
    await nextTick();

    expect(document.activeElement).not.toBe(clearButton);

    unmount();
  });

  it("paints the focus ring on the group rather than on the control", async () => {
    const { container, unmount } = renderSearchField();
    const group = slot(container, "search-field-group");
    const control = container.querySelector<HTMLInputElement>("input")!;

    const idle = getComputedStyle(group).boxShadow;

    await userEvent.click(control);
    await nextTick();

    expect(group).toHaveAttribute("data-focus-within", "true");
    expect(getComputedStyle(group).boxShadow).not.toBe(idle);
    expect(getComputedStyle(control).outlineStyle).toBe("none");

    unmount();
  });

  it("fills the group on hover and drops the fill once focus is inside", async () => {
    // `&[data-hovered="true"]:not([data-focus-within="true"])` is why both attributes have to
    // be reported: with only the first, a group that is hovered and focused keeps the fill.
    const { container, unmount } = renderSearchField();
    const group = slot(container, "search-field-group");
    const control = container.querySelector<HTMLInputElement>("input")!;

    const idle = getComputedStyle(group).backgroundColor;

    await userEvent.hover(group);
    await nextTick();

    const hovered = getComputedStyle(group).backgroundColor;

    expect(group).toHaveAttribute("data-hovered", "true");
    expect(hovered).not.toBe(idle);

    await userEvent.click(control);

    /*
     * Polled rather than checked after a single tick.
     *
     * The fill is dropped by `data-focus-within`, which is written from a `focusin` handler — so it
     * lands a tick or more after the click resolves, and how many depends on how busy the page is.
     * A fixed `nextTick()` happened to be enough most of the time and not always, which is exactly
     * what a flake is.
     */
    await expect.poll(() => getComputedStyle(group).backgroundColor).not.toBe(hovered);
    expect(group).toHaveAttribute("data-focus-within", "true");

    unmount();
  });

  it("moves focus into the control when the label is clicked", async () => {
    const { container, unmount } = renderSearchField();
    const label = slot(container, "label");
    const control = container.querySelector<HTMLInputElement>("input")!;

    expect(label).toHaveAttribute("for", control.id);

    await userEvent.click(label);

    // Polled for the same reason: the browser moves focus in response to the click on its own
    // schedule, and this is the one assertion in the suite that reads document-wide state.
    await expect.poll(() => document.activeElement).toBe(control);

    unmount();
  });

  it("keeps a control at the value its owner allows", async () => {
    const { container, unmount } = renderSearchField({ controlValue: "pinned" });
    const control = container.querySelector<HTMLInputElement>("input")!;

    await userEvent.click(control);
    await userEvent.keyboard("abc");
    await nextTick();

    expect(control.value).toBe("pinned");

    unmount();
  });

  it("has no accessibility violations", async () => {
    const { container, unmount } = renderSearchField({ withDescription: true });

    await expectNoA11yViolations(container);

    unmount();
  });

  it("has no accessibility violations with something to clear", async () => {
    const { container, unmount } = renderSearchField({ defaultValue: "shoes" });

    await expectNoA11yViolations(container);

    unmount();
  });
});
