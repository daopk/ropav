import { renderInterop } from "@ropav/testing/helpers/vue";
import { describe, expect, it, vi } from "vitest";
import { h, nextTick } from "vue";

import { ButtonRoot } from "@/components/button";
import {
  DisclosureBody,
  DisclosureContent,
  DisclosureHeading,
  DisclosureIndicator,
  DisclosureRoot,
  DisclosureTrigger,
} from "@/components/disclosure";

/**
 * The disclosure mounted the way a consumer mounts it: from a VDOM host, with every part written
 * in the host and forwarded through the root's slot.
 *
 * Everything here is already covered by the Vapor suite, and that is the reason the file exists.
 * Content written in Vapor resolves `inject` against the component that renders it, so a `provide`
 * made anywhere inside is found; content written in a VDOM host resolves against the host, so only
 * what the wrapper itself provides is found.
 */
const renderDisclosure = (props: Record<string, unknown> = {}, bareTrigger = false) =>
  renderInterop(DisclosureRoot, {
    props,
    slots: {
      default: () => [
        h(DisclosureHeading, null, {
          default: () =>
            bareTrigger
              ? h(
                  ButtonRoot,
                  { "data-testid": "bare-trigger" },
                  {
                    default: () => ["Toggle content", h(DisclosureIndicator)],
                  },
                )
              : h(DisclosureTrigger, null, {
                  default: () => ["Toggle content", h(DisclosureIndicator)],
                }),
        }),
        h(DisclosureContent, null, {
          default: () =>
            h(DisclosureBody, null, {
              default: () => [
                "Hidden content revealed on expand.",
                h(ButtonRoot, { "data-testid": "body-button" }, { default: () => "Body action" }),
              ],
            }),
        }),
      ],
    },
  });

const slot = (container: HTMLElement, name: string) =>
  container.querySelector<HTMLElement>(`[data-slot="${name}"]`);

describe("Disclosure (interop)", () => {
  it("reaches every part written in the host with the shared styles and ids", async () => {
    const { container, unmount } = renderDisclosure();

    await nextTick();

    const trigger = slot(container, "disclosure-trigger");
    const content = slot(container, "disclosure-content");

    expect(slot(container, "disclosure-heading")).toHaveClass("disclosure__heading");
    expect(trigger).toHaveClass("disclosure__trigger");
    expect(content).toHaveClass("disclosure__content");
    expect(slot(container, "disclosure-indicator")).toHaveClass("disclosure__indicator");
    expect(trigger?.getAttribute("aria-controls")).toBe(content?.id);
    expect(content?.getAttribute("aria-labelledby")).toBe(trigger?.id);

    unmount();
  });

  it("toggles from a trigger written in the host", async () => {
    const { container, unmount } = renderDisclosure();

    await nextTick();

    const trigger = slot(container, "disclosure-trigger")!;

    expect(trigger.getAttribute("aria-expanded")).toBe("false");

    trigger.click();
    await nextTick();

    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(slot(container, "disclosure-content")?.hasAttribute("hidden")).toBe(false);

    unmount();
  });

  it("hands the press down to a bare button written in the host", async () => {
    const { container, unmount } = renderDisclosure({}, true);

    await nextTick();

    const trigger = container.querySelector<HTMLButtonElement>("[data-testid='bare-trigger']")!;

    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(trigger.getAttribute("aria-controls")).toBe(slot(container, "disclosure-content")?.id);

    trigger.click();
    await nextTick();

    expect(trigger.getAttribute("aria-expanded")).toBe("true");

    unmount();
  });

  it("leaves a button written in the host inside the panel an ordinary button", async () => {
    const { container, unmount } = renderDisclosure({ defaultExpanded: true }, true);

    await nextTick();

    const bodyButton = container.querySelector<HTMLButtonElement>("[data-testid='body-button']")!;

    expect(bodyButton.hasAttribute("aria-expanded")).toBe(false);

    bodyButton.click();
    await nextTick();

    // The panel press is shadowed inside the content, so this does not collapse it.
    expect(slot(container, "disclosure-content")?.hasAttribute("hidden")).toBe(false);

    unmount();
  });

  it("carries the disabled state to a trigger written in the host", async () => {
    const { container, unmount } = renderDisclosure({ isDisabled: true });

    await nextTick();

    const trigger = slot(container, "disclosure-trigger") as HTMLButtonElement;

    expect(trigger.disabled).toBe(true);

    trigger.click();
    await nextTick();

    expect(trigger.getAttribute("aria-expanded")).toBe("false");

    unmount();
  });

  it("reports the change to the host", async () => {
    const onExpandedChange = vi.fn();
    const { container, unmount } = renderDisclosure({ onExpandedChange });

    await nextTick();

    slot(container, "disclosure-trigger")!.click();
    await nextTick();

    expect(onExpandedChange).toHaveBeenCalledWith(true);

    unmount();
  });
});
