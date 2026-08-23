import {expectNoA11yViolations} from "@ropav/testing/helpers/a11y";
import {renderVapor} from "@ropav/testing/helpers/vue";
import {describe, expect, it} from "vitest";
import {userEvent} from "vitest/browser";
import {nextTick} from "vue";

import DisclosureFixture from "./fixtures.vue";

const triggerIn = (container: HTMLElement) =>
  container.querySelector<HTMLButtonElement>("[data-slot='disclosure-trigger']")!;
const contentIn = (container: HTMLElement) =>
  container.querySelector<HTMLElement>("[data-slot='disclosure-content']")!;

const nextFrame = () => new Promise((resolve) => requestAnimationFrame(resolve));

/**
 * Waits until the panel's transitions have settled.
 *
 * The state watcher flushes after the DOM update, so nothing is animating yet at the moment of
 * the click — sampling `getAnimations()` too early returns an empty list and resolves instantly,
 * long before the 200ms height transition is done.
 */
const settle = async (panel: HTMLElement) => {
  await nextTick();
  await nextFrame();
  await Promise.all(panel.getAnimations().map((animation) => animation.finished));
  // Let the component's own post-animation continuation write `auto` / re-apply `hidden`.
  await nextTick();
  await nextFrame();
};

describe("Disclosure (browser)", () => {
  it("releases the panel height to auto after the expand animation", async () => {
    const {container, unmount} = renderVapor(DisclosureFixture);
    const trigger = triggerIn(container);
    const content = contentIn(container);

    // The Web Animations API exists here, so this is the animated branch that jsdom never
    // reaches: pixel height first, then `auto` once the animation finishes.
    expect(typeof content.getAnimations).toBe("function");

    trigger.click();
    await settle(content);

    expect(content.hasAttribute("hidden")).toBe(false);
    expect(content.style.getPropertyValue("--disclosure-panel-height")).toBe("auto");

    unmount();
  });

  it("re-applies hidden only after the collapse animation finishes", async () => {
    const {container, unmount} = renderVapor(DisclosureFixture, {props: {defaultExpanded: true}});
    const content = contentIn(container);

    triggerIn(container).click();
    await settle(content);

    expect(content.getAttribute("hidden")).toBe("until-found");
    expect(content.style.getPropertyValue("--disclosure-panel-height")).toBe("0px");

    unmount();
  });

  it("animates the height through a pixel value on the way open", async () => {
    const {container, unmount} = renderVapor(DisclosureFixture);
    const content = contentIn(container);

    triggerIn(container).click();
    await nextTick();

    // Caught mid-flight: `auto` is not animatable, so the height has to pass through pixels.
    expect(content.style.getPropertyValue("--disclosure-panel-height")).toMatch(/^\d+(\.\d+)?px$/);
    expect(content.style.getPropertyValue("--disclosure-panel-height")).not.toBe("0px");

    await settle(content);

    unmount();
  });

  it("gives the expanded panel real height and the collapsed one none", async () => {
    const {container, unmount} = renderVapor(DisclosureFixture);
    const content = contentIn(container);

    expect(content.getBoundingClientRect().height).toBe(0);

    triggerIn(container).click();
    await settle(content);

    expect(content.getBoundingClientRect().height).toBeGreaterThan(0);

    unmount();
  });

  it("keeps a collapsed panel out of the tab order", async () => {
    const {container, unmount} = renderVapor(DisclosureFixture);
    const trigger = triggerIn(container);

    trigger.focus();
    await userEvent.keyboard("{Tab}");

    // Tab leaves the disclosure entirely rather than landing on the button in the panel.
    expect(document.activeElement).not.toBe(container.querySelector("[data-testid='body-button']"));

    unmount();
  });

  it("lets tab reach the panel content once expanded", async () => {
    const {container, unmount} = renderVapor(DisclosureFixture, {props: {defaultExpanded: true}});
    const trigger = triggerIn(container);

    trigger.focus();
    await userEvent.keyboard("{Tab}");

    expect(document.activeElement).toBe(container.querySelector("[data-testid='body-button']"));

    unmount();
  });

  it("toggles on Enter and on Space", async () => {
    const {container, unmount} = renderVapor(DisclosureFixture);
    const trigger = triggerIn(container);

    trigger.focus();
    await userEvent.keyboard("{Enter}");
    expect(trigger.getAttribute("aria-expanded")).toBe("true");

    await userEvent.keyboard(" ");
    expect(trigger.getAttribute("aria-expanded")).toBe("false");

    unmount();
  });

  it("paints a focus ring on the trigger when focused by keyboard", async () => {
    const {container, unmount} = renderVapor(DisclosureFixture);
    const trigger = triggerIn(container);
    const shadowBefore = getComputedStyle(trigger).boxShadow;

    await userEvent.tab();
    await nextTick();

    // The ring is drawn with `box-shadow`, not `outline`, and the stylesheet only reaches it
    // through `[data-focus-visible]` — the pseudo-class branch of the rule never matches.
    expect(trigger).toHaveFocus();
    expect(trigger).toHaveAttribute("data-focus-visible", "true");
    expect(getComputedStyle(trigger).boxShadow).not.toBe(shadowBefore);
    expect(getComputedStyle(trigger).boxShadow).not.toBe("none");

    unmount();
  });

  it("paints no focus ring when focused by pointer", async () => {
    const {container, unmount} = renderVapor(DisclosureFixture);
    const trigger = triggerIn(container);

    await userEvent.click(trigger);
    await nextTick();

    expect(trigger).toHaveFocus();
    expect(trigger).not.toHaveAttribute("data-focus-visible");
    expect(getComputedStyle(trigger).boxShadow).toBe("none");

    unmount();
  });

  it("reports hover from a real pointer", async () => {
    const {container, unmount} = renderVapor(DisclosureFixture);
    const trigger = triggerIn(container);

    await userEvent.hover(trigger);
    await nextTick();

    expect(trigger).toHaveAttribute("data-hovered", "true");

    unmount();
  });

  it("has no axe violations while collapsed", async () => {
    const {container, unmount} = renderVapor(DisclosureFixture);

    await expectNoA11yViolations(container);

    unmount();
  });

  it("has no axe violations while expanded", async () => {
    const {container, unmount} = renderVapor(DisclosureFixture, {props: {defaultExpanded: true}});

    await expectNoA11yViolations(container);

    unmount();
  });
});
