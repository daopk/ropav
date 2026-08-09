import {renderInterop} from "@heroui/testing/helpers/vue";
import {afterEach, describe, expect, it} from "vitest";
import {h, nextTick} from "vue";

import {AlertDialog} from "@/components/alert-dialog";
import {ButtonRoot} from "@/components/button";

/**
 * The dialog mounted the way a consumer mounts it: from a VDOM host, with every part written in the
 * host and forwarded through slots.
 *
 * The dialog has three nested provides — the root's state, the backdrop's machinery and cleared
 * responders, the container's placement and size — and each is offered to content the caller wrote.
 * Content written in Vapor resolves `inject` against the component that renders it, so all of it is
 * found there whatever the shape; content written in a host resolves against the component it was
 * handed to, so the nesting has to actually line up. That cannot fail in the Vapor suite, and it is
 * the shape every real consumer uses.
 */
const settle = async () => {
  await nextTick();
  await nextTick();
  await nextTick();
};

const slot = (name: string) => document.body.querySelector(`[data-slot="${name}"]`);

const render = () =>
  renderInterop(AlertDialog, {
    props: {defaultOpen: true},
    slots: {
      default: () => [
        h(ButtonRoot, null, {default: () => "Delete account"}),
        h(
          AlertDialog.Backdrop,
          {variant: "blur"},
          {
            default: () =>
              h(
                AlertDialog.Container,
                {placement: "top", size: "lg"},
                {
                  default: () =>
                    h(AlertDialog.Dialog, null, {
                      default: () => [
                        h(AlertDialog.Header, null, {
                          default: () => [
                            h(AlertDialog.Icon, {status: "warning"}),
                            h(AlertDialog.Heading, null, {default: () => "Delete account?"}),
                          ],
                        }),
                        h(AlertDialog.Body, null, {default: () => "This cannot be undone."}),
                        h(AlertDialog.Footer, null, {
                          default: () => [
                            h(ButtonRoot, null, {default: () => "Learn more"}),
                            h(AlertDialog.Close, null, {
                              default: () => h(ButtonRoot, null, {default: () => "Delete"}),
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

describe("AlertDialog (interop)", () => {
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

    // The slot set accumulates: the backdrop decides its own variant, the container the dialog's
    // size, and each part reads whichever level is nearest above it.
    expect(slot("alert-dialog-backdrop")!.classList.contains("alert-dialog__backdrop--blur")).toBe(
      true,
    );
    expect(slot("alert-dialog-dialog")!.classList.contains("alert-dialog__dialog--lg")).toBe(true);
    expect(slot("alert-dialog-heading")!.classList.contains("alert-dialog__heading")).toBe(true);
    expect(slot("alert-dialog-body")!.classList.contains("alert-dialog__body")).toBe(true);

    result.unmount();
  });

  it("styles an icon written in the host from its own status", async () => {
    const result = render();

    await settle();

    // The one part that reads no context at all, so it has to work identically wherever it is
    // written.
    expect(slot("alert-dialog-icon")!.classList.contains("alert-dialog__icon--warning")).toBe(true);
    expect(slot("alert-dialog-default-icon")).toBeTruthy();

    result.unmount();
  });

  it("hands the container's placement to the dialog", async () => {
    const result = render();

    await settle();

    expect(slot("alert-dialog-dialog")!.getAttribute("data-placement")).toBe("top");

    result.unmount();
  });

  it("names the dialog by a heading written in the host", async () => {
    const result = render();

    await settle();

    const heading = slot("alert-dialog-heading")!;
    const dialog = result.screen.getByRole("alertdialog");

    expect(heading.id).toBeTruthy();
    expect(dialog.getAttribute("aria-labelledby")).toBe(heading.id);
    // The dialog's own id is what the trigger points at, and it comes from the root two levels up.
    expect(dialog.id).toBeTruthy();
    expect(
      result.container.querySelector("[data-slot='button']")!.getAttribute("aria-controls"),
    ).toBe(dialog.id);

    result.unmount();
  });

  it("keeps a button in the footer from inheriting the trigger's press", async () => {
    const result = render();

    await settle();

    const inside = document.body.querySelector(
      "[data-slot='alert-dialog-footer'] [data-slot='button']",
    )!;

    // Cleared at the backdrop, which is where the boundary is. Inheriting it would make the button
    // toggle the dialog and claim the trigger's id on a second element.
    expect(inside.getAttribute("aria-expanded")).toBeNull();
    expect(inside.getAttribute("aria-controls")).toBeNull();
    expect(inside.id).toBe("");

    result.unmount();
  });

  it("still lets a wrapped button close the dialog", async () => {
    const result = render();

    await settle();

    const remove = result.screen.getByRole("button", {name: "Delete"});

    remove.dispatchEvent(new MouseEvent("click", {bubbles: true, button: 0, detail: 1}));
    await settle();

    // The wrapper provides below the cleared boundary, so opting in still works from the host.
    expect(result.screen.queryByRole("alertdialog")).toBeNull();

    result.unmount();
  });
});
