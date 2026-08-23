import { expectNoA11yViolations } from "@ropav/testing/helpers/a11y";
import { renderVapor } from "@ropav/testing/helpers/vue";
import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { nextTick } from "vue";

import DisclosureGroupFixture from "./fixtures.vue";

const triggersIn = (container: HTMLElement) => [
  ...container.querySelectorAll<HTMLButtonElement>("[data-slot='disclosure-trigger']"),
];
const contentsIn = (container: HTMLElement) => [
  ...container.querySelectorAll<HTMLElement>("[data-slot='disclosure-content']"),
];

const nextFrame = () => new Promise((resolve) => requestAnimationFrame(resolve));

/** Waits until every panel's transitions have settled. See the Disclosure browser suite. */
const settle = async (panels: HTMLElement[]) => {
  await nextTick();
  await nextFrame();
  await Promise.all(panels.flatMap((panel) => panel.getAnimations().map((a) => a.finished)));
  await nextTick();
  await nextFrame();
};

describe("DisclosureGroup (browser)", () => {
  it("swaps which panel is open, animation and hidden attribute included", async () => {
    const { container, unmount } = renderVapor(DisclosureGroupFixture, {
      props: { defaultExpandedKeys: ["one"] },
    });
    const panels = contentsIn(container);

    triggersIn(container)[1]?.click();
    await settle(panels);

    expect(panels[0]?.getAttribute("hidden")).toBe("until-found");
    expect(panels[0]?.style.getPropertyValue("--disclosure-panel-height")).toBe("0px");
    expect(panels[1]?.hasAttribute("hidden")).toBe(false);
    expect(panels[1]?.style.getPropertyValue("--disclosure-panel-height")).toBe("auto");
    expect(panels[1]?.getBoundingClientRect().height).toBeGreaterThan(0);

    unmount();
  });

  it("keeps both panels open and measurable when several may be expanded", async () => {
    const { container, unmount } = renderVapor(DisclosureGroupFixture, {
      props: { allowsMultipleExpanded: true, defaultExpandedKeys: ["one"] },
    });
    const panels = contentsIn(container);

    triggersIn(container)[1]?.click();
    await settle(panels);

    expect(panels[0]?.getBoundingClientRect().height).toBeGreaterThan(0);
    expect(panels[1]?.getBoundingClientRect().height).toBeGreaterThan(0);

    unmount();
  });

  it("moves focus between triggers with a real keyboard", async () => {
    const { container, unmount } = renderVapor(DisclosureGroupFixture);
    const triggers = triggersIn(container);

    triggers[0]?.focus();

    await userEvent.keyboard("{ArrowDown}");
    expect(document.activeElement).toBe(triggers[1]);

    await userEvent.keyboard("{End}");
    expect(document.activeElement).toBe(triggers[2]);

    await userEvent.keyboard("{Home}");
    expect(document.activeElement).toBe(triggers[0]);

    unmount();
  });

  it("tabs through every trigger, skipping the collapsed panels", async () => {
    const { container, unmount } = renderVapor(DisclosureGroupFixture);
    const triggers = triggersIn(container);

    triggers[0]?.focus();
    await userEvent.keyboard("{Tab}");
    expect(document.activeElement).toBe(triggers[1]);

    await userEvent.keyboard("{Tab}");
    expect(document.activeElement).toBe(triggers[2]);

    unmount();
  });

  it("has no axe violations while collapsed", async () => {
    const { container, unmount } = renderVapor(DisclosureGroupFixture);

    await expectNoA11yViolations(container);

    unmount();
  });

  it("has no axe violations with a panel open", async () => {
    const { container, unmount } = renderVapor(DisclosureGroupFixture, {
      props: { allowsMultipleExpanded: true, defaultExpandedKeys: ["one", "two"] },
    });

    await expectNoA11yViolations(container);

    unmount();
  });
});
