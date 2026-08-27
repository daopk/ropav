import { PALETTE_CONTRAST_DEBT, expectNoA11yViolations } from "@ropav/testing/helpers/a11y";
import { renderVapor } from "@ropav/testing/helpers/vue";
import { afterEach, describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { nextTick } from "vue";

import { LinkRoot } from "@/components/link";

import { parkPointer } from "../../harness/park-pointer";
import { settled } from "../../harness/settle";

const renderLink = (props: Record<string, unknown> = {}) =>
  renderVapor(LinkRoot, {
    props,
    slots: { default: () => document.createTextNode("Call to action") },
  });

const linkIn = (container: HTMLElement) =>
  container.querySelector<HTMLElement>('[data-slot="link"]')!;

/**
 * A real anchor follows its href, and the page every browser test shares is the one it would
 * navigate. Blocked in the capture phase so the component's own click handler still runs and only
 * the navigation is dropped.
 */
const blockNavigation = () => {
  const block = (event: MouseEvent) => event.preventDefault();

  document.addEventListener("click", block, { capture: true });

  return () => document.removeEventListener("click", block, { capture: true });
};

/**
 * Link publishes activation as a press rather than as a DOM click, and renders as an anchor or a
 * span depending on whether it has anywhere to go. Both halves of that are keyboard behaviour the
 * browser owns: what Enter does on a span is not what it does on an anchor, and neither is decided
 * by the component. The jsdom suite reaches them with `dispatchEvent(new KeyboardEvent(...))`,
 * which runs the handler but skips the default action the handler exists to talk about.
 */
describe("Link (browser)", () => {
  let restoreNavigation: (() => void) | undefined;

  afterEach(() => {
    restoreNavigation?.();
    restoreNavigation = undefined;
  });

  it("activates a destination-less link on Enter, which the DOM would not", async () => {
    const onPress = vi.fn();
    const clicks = vi.fn();
    const { container, unmount } = renderLink({ onClick: clicks, onPress });
    const link = linkIn(container);

    // No href, so this is the span branch: `role="link"`, and nothing native to activate.
    expect(link.tagName).toBe("SPAN");
    expect(link).toHaveAttribute("role", "link");

    link.focus();
    await userEvent.keyboard("{Enter}");
    await nextTick();

    // The press is the whole point: a real Enter on a span produces no click, so a consumer
    // listening to the DOM would hear nothing at all.
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(clicks).not.toHaveBeenCalled();

    unmount();
  });

  it("activates an anchor on Enter", async () => {
    restoreNavigation = blockNavigation();

    const onPress = vi.fn();
    const { container, unmount } = renderLink({ href: "#link-enter", onPress });
    const link = linkIn(container);

    expect(link.tagName).toBe("A");

    link.focus();
    await userEvent.keyboard("{Enter}");
    await nextTick();

    // Here the browser does synthesise a click, and the press must still be reported once
    // rather than twice — the keydown path and the click path both reach `usePress`.
    expect(onPress).toHaveBeenCalledTimes(1);

    unmount();
  });

  it("never treats Space as activating, on either branch", async () => {
    const onPress = vi.fn();
    const { container, unmount } = renderLink({ onPress });

    linkIn(container).focus();
    await userEvent.keyboard(" ");
    await nextTick();

    expect(onPress).not.toHaveBeenCalled();

    unmount();

    restoreNavigation = blockNavigation();

    const anchor = renderLink({ href: "#link-space", onPress });

    linkIn(anchor.container).focus();
    await userEvent.keyboard(" ");
    await nextTick();

    // Space scrolls the page on a link, and that is the behaviour being preserved: the component
    // must not turn it into an activation the way it would on a button.
    expect(onPress).not.toHaveBeenCalled();

    anchor.unmount();
  });

  /**
   * `link-root.vue` chains `pointerenter` and `pointerleave` by hand instead of spreading them,
   * because a listener reaching a vapor element through `v-bind` is re-attached on every render and
   * can be dropped mid-dispatch. Nothing proves that chaining holds until a real pointer crosses
   * onto the link — the crossing is what re-renders it, and a dispatched `pointerdown` arrives
   * without one.
   *
   * The pointer is parked first because it belongs to the page rather than to this test: left on
   * the link by an earlier file, the press would never cross the boundary and the case would pass
   * without exercising anything.
   */
  it("reports hover and press from the pointer itself", async () => {
    await parkPointer();
    restoreNavigation = blockNavigation();

    const onPress = vi.fn();
    const { container, unmount } = renderLink({ href: "#link-pointer", onPress });
    const link = linkIn(container);

    await userEvent.hover(link);
    await nextTick();

    // The attribute the stylesheet reads agrees with what the browser itself computes.
    expect(link.matches(":hover")).toBe(true);
    expect(link).toHaveAttribute("data-hovered", "true");

    await userEvent.click(link);
    await nextTick();

    expect(onPress).toHaveBeenCalledTimes(1);
    // The press ended with the pointer, but the pointer never left.
    expect(link).not.toHaveAttribute("data-pressed");
    expect(link).toHaveAttribute("data-hovered", "true");

    unmount();
  });

  /**
   * A press released somewhere else is not an activation, and the release is what says so: the
   * pointer never comes back to produce a click. Native `:active` sticks here, which is why the
   * stylesheet reads the rendered attribute instead.
   *
   * What this cannot reach is the press *re-arming* when a held pointer leaves the link and comes
   * back — `usePress` tracks that by pointer id, and `userEvent` offers no three-point drag to
   * produce it. That branch stays uncovered on purpose rather than by a gesture that only looks
   * like it.
   */
  it("abandons a press dragged off the link", async () => {
    await parkPointer();

    const onPress = vi.fn();
    const { container, unmount } = renderLink({ href: "#link-drag", onPress });
    const link = linkIn(container);

    await userEvent.dragAndDrop(link, document.body);
    await nextTick();

    expect(link).not.toHaveAttribute("data-pressed");
    expect(onPress).not.toHaveBeenCalled();

    unmount();
  });

  it("paints a focus ring on keyboard focus", async () => {
    await parkPointer();

    const { container, unmount } = renderLink({ href: "#link-ring" });
    const link = linkIn(container);

    const shadowWhenIdle = getComputedStyle(link).boxShadow;

    await userEvent.keyboard("{Tab}");
    await nextTick();

    expect(link).toHaveFocus();
    expect(link.matches(":focus-visible")).toBe(true);
    expect(link).toHaveAttribute("data-focus-visible", "true");

    await settled(link);

    // The ring is a ring utility, so it lands on box-shadow rather than on outline.
    expect(getComputedStyle(link).boxShadow).not.toBe(shadowWhenIdle);

    unmount();
  });

  /**
   * A separate render from the keyboard case on purpose. Chrome keeps `:focus-visible` on an
   * element that already had it when a click arrives, so tabbing to a link and then clicking the
   * same one is not the state a consumer reaches by clicking a link they never tabbed to.
   */
  it("paints no focus ring when focus arrives from the pointer", async () => {
    await parkPointer();
    restoreNavigation = blockNavigation();

    const { container, unmount } = renderLink({ href: "#link-no-ring" });
    const link = linkIn(container);

    const shadowWhenIdle = getComputedStyle(link).boxShadow;

    await userEvent.click(link);
    await nextTick();

    expect(link).toHaveFocus();
    // The rendered attribute agrees with what the browser itself computes.
    expect(link.matches(":focus-visible")).toBe(false);
    expect(link.hasAttribute("data-focus-visible")).toBe(false);
    expect(link).toHaveAttribute("data-focused", "true");

    await settled(link);

    expect(getComputedStyle(link).boxShadow).toBe(shadowWhenIdle);

    unmount();
  });

  it("puts a disabled link beyond the pointer and the tab order", async () => {
    const { container, unmount } = renderLink({ href: "#link-disabled", isDisabled: true });
    const link = linkIn(container);

    // Disabled drops the anchor entirely, so there is no href for a stray click or a middle-click
    // to follow.
    expect(link.tagName).toBe("SPAN");
    expect(link).not.toHaveAttribute("href");
    expect(link).not.toHaveAttribute("tabindex");

    // `status-disabled` takes it out of the pointer's reach in the stylesheet rather than in JS,
    // so no handler is involved and only a real cascade shows it.
    expect(getComputedStyle(link).pointerEvents).toBe("none");

    await userEvent.keyboard("{Tab}");
    await nextTick();

    expect(link).not.toHaveFocus();

    unmount();
  });

  it("has no axe violations on either branch", async () => {
    const anchor = renderLink({ href: "#link-axe" });

    // The accent pair is palette debt, named in one place rather than switched off inline.
    await expectNoA11yViolations(anchor.container, PALETTE_CONTRAST_DEBT);

    anchor.unmount();

    // The span branch carries the role by hand, which is the half axe can actually disagree with.
    const span = renderLink({ isDisabled: true });

    await expectNoA11yViolations(span.container, PALETTE_CONTRAST_DEBT);

    span.unmount();
  });
});
