import {renderInterop} from "@heroui/testing/helpers/vue";
import {describe, expect, it, vi} from "vitest";
import {h, nextTick} from "vue";

import {ButtonRoot} from "@/components/button";
import {
  DisclosureBody,
  DisclosureContent,
  DisclosureHeading,
  DisclosureIndicator,
  DisclosureRoot,
  DisclosureTrigger,
} from "@/components/disclosure";
import {DisclosureGroupRoot} from "@/components/disclosure-group";

/**
 * The group mounted the way a consumer mounts it: from a VDOM host, with the disclosures written
 * in the host and forwarded through the group's slot.
 *
 * Everything here is already covered by the Vapor suite, and that is the reason the file exists.
 * Content written in Vapor resolves `inject` against the component that renders it, so the group
 * state is found wherever it was provided; content written in a VDOM host resolves against the
 * host, so only what the group itself provides is found — and a disclosure that cannot see the
 * group would silently fall back to holding its own state, leaving single expansion broken.
 */
const ITEMS = ["one", "two", "three"];

const renderGroup = (props: Record<string, unknown> = {}, bareTriggers = false) =>
  renderInterop(DisclosureGroupRoot, {
    props,
    slots: {
      default: () =>
        ITEMS.map((item) =>
          h(
            DisclosureRoot,
            {id: item, key: item},
            {
              default: () => [
                h(DisclosureHeading, null, {
                  default: () =>
                    bareTriggers
                      ? h(
                          ButtonRoot,
                          {"data-testid": `bare-${item}`},
                          {
                            default: () => [`Trigger ${item}`, h(DisclosureIndicator)],
                          },
                        )
                      : h(DisclosureTrigger, null, {
                          default: () => [`Trigger ${item}`, h(DisclosureIndicator)],
                        }),
                }),
                h(DisclosureContent, null, {
                  default: () => h(DisclosureBody, null, {default: () => `Panel ${item}`}),
                }),
              ],
            },
          ),
        ),
    },
  });

const triggersIn = (container: HTMLElement) => [
  ...container.querySelectorAll<HTMLButtonElement>("[data-slot='disclosure-trigger']"),
];
const bareTriggersIn = (container: HTMLElement) => [
  ...container.querySelectorAll<HTMLButtonElement>("[data-testid^='bare-']"),
];

describe("DisclosureGroup (interop)", () => {
  it("reaches every disclosure written in the host", async () => {
    const {container, unmount} = renderGroup();

    await nextTick();

    expect(container.querySelector("[data-slot='disclosure-group']")).toHaveClass(
      "disclosure-group",
    );
    expect(triggersIn(container)).toHaveLength(3);

    unmount();
  });

  it("collapses the open disclosure when only one may be expanded", async () => {
    const {container, unmount} = renderGroup();

    await nextTick();

    const [one, two] = triggersIn(container);

    one?.click();
    await nextTick();
    two?.click();
    await nextTick();

    // A disclosure that could not see the group would keep its own state and stay open here.
    expect(one?.getAttribute("aria-expanded")).toBe("false");
    expect(two?.getAttribute("aria-expanded")).toBe("true");

    unmount();
  });

  it("reports the expanded key set to the host", async () => {
    const onExpandedChange = vi.fn();
    const {container, unmount} = renderGroup({onExpandedChange});

    await nextTick();

    triggersIn(container)[2]?.click();
    await nextTick();

    expect(onExpandedChange).toHaveBeenCalledWith(new Set(["three"]));

    unmount();
  });

  it("carries the group's disabled state to every disclosure", async () => {
    const {container, unmount} = renderGroup({isDisabled: true});

    await nextTick();

    expect(triggersIn(container).map((trigger) => trigger.disabled)).toEqual([true, true, true]);

    unmount();
  });

  it("moves focus between triggers written in the host", async () => {
    const {container, unmount} = renderGroup();

    await nextTick();

    const triggers = triggersIn(container);

    triggers[0]?.focus();
    triggers[0]?.dispatchEvent(
      new KeyboardEvent("keydown", {bubbles: true, cancelable: true, key: "ArrowDown"}),
    );

    expect(document.activeElement).toBe(triggers[1]);

    unmount();
  });

  it("registers bare button triggers written in the host for keyboard navigation", async () => {
    const {container, unmount} = renderGroup({}, true);

    await nextTick();

    const triggers = bareTriggersIn(container);

    expect(triggers).toHaveLength(3);

    triggers[0]?.focus();
    triggers[0]?.dispatchEvent(
      new KeyboardEvent("keydown", {bubbles: true, cancelable: true, key: "End"}),
    );

    expect(document.activeElement).toBe(triggers[2]);

    unmount();
  });
});
