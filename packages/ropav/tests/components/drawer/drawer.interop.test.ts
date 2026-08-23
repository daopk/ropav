import {renderInterop} from "@ropav/testing/helpers/vue";
import {afterEach, describe, expect, it} from "vitest";
import {h, nextTick} from "vue";

import {ButtonRoot} from "@/components/button";
import {Drawer} from "@/components/drawer";

/**
 * The drawer mounted the way a consumer mounts it: from a VDOM host, with every part written in the
 * host and forwarded through slots.
 *
 * The drawer has three nested provides — the root's state, the backdrop's machinery and cleared
 * responders, the content's placement — and each is offered to content the caller wrote. Content
 * written in Vapor resolves `inject` against the component that renders it, so all of it is found
 * there whatever the shape; content written in a host resolves against the component it was handed
 * to, so the nesting has to actually line up.
 */
const settle = async () => {
  await nextTick();
  await nextTick();
  await nextTick();
};

const slot = (name: string) => document.body.querySelector(`[data-slot="${name}"]`);

const render = () =>
  renderInterop(Drawer, {
    props: {defaultOpen: true},
    slots: {
      default: () => [
        h(Drawer.Trigger, null, {default: () => "Open drawer"}),
        h(
          Drawer.Backdrop,
          {variant: "blur"},
          {
            default: () =>
              h(
                Drawer.Content,
                {placement: "right"},
                {
                  default: () =>
                    h(Drawer.Dialog, null, {
                      default: () => [
                        h(Drawer.Handle),
                        h(Drawer.Header, null, {
                          default: () => h(Drawer.Heading, null, {default: () => "Drawer heading"}),
                        }),
                        h(Drawer.Body, null, {default: () => "Drawer body"}),
                        h(Drawer.Footer, null, {
                          default: () => [
                            h(ButtonRoot, null, {default: () => "Inside action"}),
                            h(Drawer.Close, null, {
                              default: () => h(ButtonRoot, null, {default: () => "Confirm"}),
                            }),
                          ],
                        }),
                      ],
                    }),
                },
              ),
          },
        ),
      ],
    },
  });

describe("Drawer (interop)", () => {
  afterEach(() => {
    document.documentElement.style.overflow = "";

    for (const child of [...document.body.children]) {
      child.removeAttribute("inert");
      child.removeAttribute("aria-hidden");
    }
  });

  it("carries the variants each level decided down to the parts", async () => {
    const result = render();

    await settle();

    // The slot set accumulates: the backdrop decides its own variant, the content the edge
    // everything is pinned to, and each part reads whichever level is nearest above it.
    expect(slot("drawer-backdrop")!.classList.contains("drawer__backdrop--blur")).toBe(true);
    expect(slot("drawer-content")!.classList.contains("drawer__content--right")).toBe(true);
    expect(slot("drawer-dialog")!.classList.contains("drawer__dialog--right")).toBe(true);
    expect(slot("drawer-heading")!.classList.contains("drawer__heading")).toBe(true);
    expect(slot("drawer-handle")!.classList.contains("drawer__handle")).toBe(true);

    result.unmount();
  });

  it("hands the content's placement to the panel", async () => {
    const result = render();

    await settle();

    expect(slot("drawer-dialog")!.getAttribute("data-placement")).toBe("right");

    result.unmount();
  });

  it("claims the pointer on a panel written in the host", async () => {
    const result = render();

    await settle();

    // `isDismissable` travels the other way, from the backdrop down — so a panel written in the
    // host has to find it there or it silently stops being draggable.
    expect((slot("drawer-dialog") as HTMLElement).style.touchAction).toBe("none");

    result.unmount();
  });

  it("names the dialog by a heading written in the host", async () => {
    const result = render();

    await settle();

    const heading = slot("drawer-heading")!;
    const dialog = result.screen.getByRole("dialog");

    expect(heading.id).toBeTruthy();
    expect(dialog.getAttribute("aria-labelledby")).toBe(heading.id);
    // The dialog's own id is what the trigger points at, and it comes from the root two levels up.
    expect(dialog.id).toBeTruthy();
    expect(slot("drawer-trigger")!.getAttribute("aria-controls")).toBe(dialog.id);

    result.unmount();
  });

  it("keeps a button in the footer from inheriting the trigger's press", async () => {
    const result = render();

    await settle();

    const inside = document.body.querySelector("[data-slot='drawer-footer'] [data-slot='button']")!;

    // Cleared at the backdrop, which is where the boundary is. Inheriting it would make the button
    // toggle the drawer and claim the trigger's id on a second element.
    expect(inside.getAttribute("aria-expanded")).toBeNull();
    expect(inside.getAttribute("aria-controls")).toBeNull();
    expect(inside.id).toBe("");

    result.unmount();
  });

  it("still lets a wrapped button close the drawer", async () => {
    const result = render();

    await settle();

    const confirm = result.screen.getByRole("button", {name: "Confirm"});

    confirm.dispatchEvent(new MouseEvent("click", {bubbles: true, button: 0, detail: 1}));
    await settle();

    // The wrapper provides below the cleared boundary, so opting in still works from the host.
    expect(result.screen.queryByRole("dialog")).toBeNull();

    result.unmount();
  });
});
