import { renderInterop } from "@ropav/testing/helpers/vue";
import { afterEach, describe, expect, it } from "vitest";
import { h, nextTick } from "vue";

import { ButtonRoot } from "@/components/button";
import { Popover } from "@/components/popover";

/**
 * The popover mounted the way a consumer mounts it: from a VDOM host, with the content written in
 * the host and forwarded through `Popover.Content`'s slot.
 *
 * Everything here is already covered by the Vapor suite, and that is the reason the file exists.
 * Content written in Vapor resolves `inject` against the component that renders it, so a `provide`
 * made anywhere inside the overlay is found; content written in a VDOM host resolves against the
 * host, so only what the wrapper itself provides is found. Every assertion below passed in the
 * Vapor suite while being broken in every real host.
 */
const settle = async () => {
  await nextTick();
  await nextTick();
  await nextTick();
};

const render = () =>
  renderInterop(Popover, {
    props: { defaultOpen: true },
    slots: {
      default: () => [
        h(ButtonRoot, null, { default: () => "Open popover" }),
        // Never flipped: a jsdom measurement is all zeroes, so a placement free to flip would
        // report whichever side the fallback lands on rather than the one asked for.
        h(
          Popover.Content,
          { shouldFlip: false },
          {
            default: () =>
              h(Popover.Dialog, null, {
                default: () => [
                  h(Popover.Arrow),
                  h(Popover.Heading, null, { default: () => "Popover heading" }),
                  h(ButtonRoot, null, { default: () => "Inside action" }),
                ],
              }),
          },
        ),
      ],
    },
  });

const slot = (name: string) => document.body.querySelector(`[data-slot="${name}"]`);

describe("Popover (interop)", () => {
  afterEach(() => {
    // The overlay writes `inert` and `aria-hidden` outside its own container, so a leftover would
    // surface in an unrelated test rather than this one.
    document.querySelectorAll("[inert]").forEach((element) => element.removeAttribute("inert"));
    document
      .querySelectorAll("[aria-hidden]")
      .forEach((element) => element.removeAttribute("aria-hidden"));
  });

  it("keeps a button in the content from inheriting the trigger's press", async () => {
    const result = render();

    await settle();

    const trigger = result.container.querySelector("[data-slot='button']");
    const inside = document.body.querySelector(".popover [data-slot='button']");

    expect(trigger).toBeTruthy();
    expect(inside).toBeTruthy();
    expect(trigger).not.toBe(inside);

    // The trigger's own markers, which say what it opens.
    expect(trigger!.getAttribute("aria-expanded")).toBe("true");
    expect(trigger!.getAttribute("aria-controls")).toBeTruthy();

    // None of it reaches the content. A button that inherited them would toggle the popover, and
    // would carry the trigger's id on a second element.
    expect(inside!.getAttribute("aria-expanded")).toBeNull();
    expect(inside!.getAttribute("aria-controls")).toBeNull();
    expect(inside!.id).toBe("");

    result.unmount();
  });

  it("positions the popover against the trigger rather than its own content", async () => {
    const result = render();

    await settle();

    const trigger = result.container.querySelector("[data-slot='button']");
    const inside = document.body.querySelector(".popover [data-slot='button']");

    // The element the overlay measures is the one the trigger registered. A button in the content
    // that inherited the press would have registered itself last and won, which is the same bug
    // seen from the positioning side: the popover would be laid out against a button inside itself.
    expect(document.body.querySelector(".popover")).toBeTruthy();
    expect(inside!.hasAttribute("id")).toBe(false);
    expect(trigger!.id).toBeTruthy();

    result.unmount();
  });

  it("names the dialog with the id the trigger points at", async () => {
    const result = render();

    await settle();

    const trigger = result.container.querySelector("[data-slot='button']");
    const dialog = result.screen.getByRole("dialog");

    expect(dialog.id).toBeTruthy();
    expect(trigger!.getAttribute("aria-controls")).toBe(dialog.id);

    // The overlay steps aside when the content is already a dialog, so it carries neither the role
    // nor the id — two nested dialogs is not something assistive technology can read.
    const popover = document.body.querySelector(".popover")!;

    expect(popover.getAttribute("role")).toBeNull();
    expect(popover.hasAttribute("id")).toBe(false);

    result.unmount();
  });

  it("tells the arrow in the content which side it is on", async () => {
    const result = render();

    await settle();

    const group = slot("popover-overlay-arrow-group");

    expect(group).toBeTruthy();
    // The placement the overlay resolved, read by content the overlay never provided for directly.
    // Without it the arrow keeps its unplaced offsets and sits in the middle of the popover.
    expect(group!.getAttribute("data-placement")).toBe("bottom");
    expect(slot("popover-overlay-arrow")).toBeTruthy();

    result.unmount();
  });
});
