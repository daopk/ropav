import {expectNoA11yViolations} from "@heroui/testing/helpers/a11y";
import {renderVapor} from "@heroui/testing/helpers/vue";
import {describe, expect, it} from "vitest";
import {userEvent} from "vitest/browser";
import {nextTick} from "vue";

import AccordionFixture from "./fixtures.vue";

const triggersIn = (container: HTMLElement) => [
  ...container.querySelectorAll<HTMLButtonElement>("[data-slot='accordion-trigger']"),
];
const panelsIn = (container: HTMLElement) => [
  ...container.querySelectorAll<HTMLElement>("[data-slot='accordion-panel']"),
];

const nextFrame = () => new Promise((resolve) => requestAnimationFrame(resolve));

/**
 * Waits until the panel's transitions have settled.
 *
 * The state watcher flushes after the DOM update, so nothing is animating yet at the
 * moment of the click — sampling `getAnimations()` too early returns an empty list and
 * resolves instantly, long before the 200ms height transition is done.
 */
const settle = async (panel: HTMLElement) => {
  await nextTick();
  await nextFrame();
  await Promise.all(panel.getAnimations().map((animation) => animation.finished));
  // Let the component's own post-animation continuation write `auto` / re-apply `hidden`.
  await nextTick();
  await nextFrame();
};

describe("Accordion (browser)", () => {
  it("releases the panel height to auto after the expand animation", async () => {
    const {container, unmount} = renderVapor(AccordionFixture);
    const trigger = triggersIn(container)[0]!;
    const panel = panelsIn(container)[0]!;

    // The Web Animations API exists here, so this is the animated branch that jsdom
    // never reaches: pixel height first, then `auto` once the animation finishes.
    expect(typeof panel.getAnimations).toBe("function");

    trigger.click();
    await settle(panel);

    expect(panel.hasAttribute("hidden")).toBe(false);
    expect(panel.style.getPropertyValue("--disclosure-panel-height")).toBe("auto");

    unmount();
  });

  it("re-applies hidden only after the collapse animation finishes", async () => {
    const {container, unmount} = renderVapor(AccordionFixture, {
      props: {defaultExpandedKeys: ["one"]},
    });
    const trigger = triggersIn(container)[0]!;
    const panel = panelsIn(container)[0]!;

    trigger.click();
    await settle(panel);

    expect(panel.getAttribute("hidden")).toBe("until-found");
    expect(panel.style.getPropertyValue("--disclosure-panel-height")).toBe("0px");

    unmount();
  });

  it("gives the expanded panel real height and the collapsed one none", async () => {
    const {container, unmount} = renderVapor(AccordionFixture);
    const trigger = triggersIn(container)[0]!;
    const panel = panelsIn(container)[0]!;

    expect(panel.getBoundingClientRect().height).toBe(0);

    trigger.click();
    await settle(panel);

    expect(panel.getBoundingClientRect().height).toBeGreaterThan(0);

    unmount();
  });

  it("keeps a collapsed panel out of the tab order", async () => {
    const {container, unmount} = renderVapor(AccordionFixture);
    const triggers = triggersIn(container);

    triggers[0]!.focus();
    await userEvent.keyboard("{Tab}");

    // Tab lands on the next trigger, not on anything inside the collapsed panel.
    expect(document.activeElement).toBe(triggers[1]);

    unmount();
  });

  it("moves focus between triggers with the arrow keys", async () => {
    const {container, unmount} = renderVapor(AccordionFixture);
    const triggers = triggersIn(container);

    triggers[0]!.focus();
    await userEvent.keyboard("{ArrowDown}");
    expect(document.activeElement).toBe(triggers[1]);

    await userEvent.keyboard("{End}");
    expect(document.activeElement).toBe(triggers[2]);

    await userEvent.keyboard("{Home}");
    expect(document.activeElement).toBe(triggers[0]);

    unmount();
  });

  it("toggles on Enter and on Space", async () => {
    const {container, unmount} = renderVapor(AccordionFixture);
    const trigger = triggersIn(container)[0]!;

    trigger.focus();
    await userEvent.keyboard("{Enter}");
    expect(trigger.getAttribute("aria-expanded")).toBe("true");

    await userEvent.keyboard(" ");
    expect(trigger.getAttribute("aria-expanded")).toBe("false");

    unmount();
  });

  it("paints a focus ring on the trigger when focused by keyboard", async () => {
    const {container, unmount} = renderVapor(AccordionFixture);
    const trigger = triggersIn(container)[0]!;
    const shadowBefore = getComputedStyle(trigger).boxShadow;

    await userEvent.tab();
    await nextTick();

    // Measured rather than inferred from `:focus-visible`: the ring is drawn with `box-shadow`,
    // and the only rule that reaches it is `[data-focus-visible="true"]` — the
    // `&:focus-visible:not(:focus)` branch beside it can never match on a real button (debt #14).
    expect(trigger).toHaveFocus();
    expect(trigger).toHaveAttribute("data-focus-visible", "true");
    expect(getComputedStyle(trigger).boxShadow).not.toBe(shadowBefore);
    expect(getComputedStyle(trigger).boxShadow).not.toBe("none");

    unmount();
  });

  it("paints no focus ring when focused by pointer", async () => {
    const {container, unmount} = renderVapor(AccordionFixture);
    const trigger = triggersIn(container)[0]!;

    await userEvent.click(trigger);
    await nextTick();

    expect(trigger).toHaveFocus();
    expect(trigger).not.toHaveAttribute("data-focus-visible");
    expect(getComputedStyle(trigger).boxShadow).toBe("none");

    unmount();
  });

  it("reports hover from a real pointer", async () => {
    const {container, unmount} = renderVapor(AccordionFixture);
    const trigger = triggersIn(container)[0]!;

    await userEvent.hover(trigger);
    await nextTick();

    expect(trigger).toHaveAttribute("data-hovered", "true");

    unmount();
  });

  it("has no axe violations while collapsed", async () => {
    const {container, unmount} = renderVapor(AccordionFixture);

    await expectNoA11yViolations(container);

    unmount();
  });

  it("has no axe violations while expanded", async () => {
    const {container, unmount} = renderVapor(AccordionFixture, {
      props: {allowsMultipleExpanded: true, defaultExpandedKeys: ["one", "two"]},
    });

    await expectNoA11yViolations(container);

    unmount();
  });
});
