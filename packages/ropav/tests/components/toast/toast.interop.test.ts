import type {QueuedToast} from "@/components/toast";

import {renderInterop} from "@heroui/testing/helpers/vue";
import {afterEach, describe, expect, it} from "vitest";
import {h, nextTick} from "vue";

import {
  Toast,
  ToastContent,
  ToastDescription,
  ToastIndicator,
  ToastProvider,
  ToastQueue,
  ToastTitle,
} from "@/components/toast";

const mounted: {unmount: () => void}[] = [];

const settle = async () => {
  await nextTick();
  await nextTick();
  await nextTick();
};

const slot = (name: string) => document.body.querySelector(`[data-slot="${name}"]`);

/**
 * Every consumer mounts through a VDOM host, and a custom toast tree is written *there* and
 * forwarded into the provider's slot. That is the one arrangement in which a `provide` made inside
 * the teleport would not be found — and the harness that renders pure vapor cannot go red for it,
 * because it resolves `inject` against the component being rendered rather than the ancestry a
 * real host builds.
 */
describe("Toast interop", () => {
  afterEach(() => {
    while (mounted.length > 0) {
      try {
        mounted.pop()!.unmount();
      } catch {
        /* already unmounted */
      }
    }
    document.body.innerHTML = "";
  });

  it("reaches a custom toast tree written at the host with the region's context", async () => {
    const queue = new ToastQueue();

    mounted.push(
      renderInterop(ToastProvider, {
        props: {placement: "top end", queue},
        slots: {
          default: (slotProps) =>
            h(
              Toast,
              {toast: (slotProps as {toast: QueuedToast}).toast},
              {
                default: () => [
                  h(ToastIndicator),
                  h(ToastContent, null, {
                    default: () => [
                      h(ToastTitle, null, {default: () => "Saved"}),
                      h(ToastDescription, null, {default: () => "All done"}),
                    ],
                  }),
                ],
              },
            ),
        },
      }),
    );

    queue.add({title: "Saved", variant: "success"});
    await settle();

    const toast = slot("toast")!;

    // Resolved from the provider: the tv slots, and the placement the region was given.
    expect(toast.className).toContain("toast");
    expect(toast.className).toContain("toast--top-end");
    expect(slot("toast-indicator")!.className).toContain("toast__indicator");
    expect(slot("toast-content")!.className).toContain("toast__content");
    expect(slot("toast-title")!.className).toContain("toast__title");
    expect(slot("toast-description")!.className).toContain("toast__description");
  });

  it("reaches the parts inside a host-written toast with that toast's own context", async () => {
    const queue = new ToastQueue();

    mounted.push(
      renderInterop(ToastProvider, {
        props: {queue},
        slots: {
          default: (slotProps) =>
            h(
              Toast,
              {toast: (slotProps as {toast: QueuedToast}).toast},
              {
                default: () => [
                  h(ToastContent, null, {
                    default: () => [
                      h(ToastTitle, null, {default: () => "Saved"}),
                      h(ToastDescription, null, {default: () => "All done"}),
                    ],
                  }),
                ],
              },
            ),
        },
      }),
    );

    queue.add({title: "Saved"});
    await settle();

    const toast = slot("toast")!;

    // Ids and the announcement come from the per-toast context, not the region's.
    expect(toast.getAttribute("aria-labelledby")).toBe(slot("toast-title")!.getAttribute("id"));
    expect(toast.getAttribute("aria-describedby")).toBe(
      slot("toast-description")!.getAttribute("id"),
    );
    expect(slot("toast-content")).toHaveAttribute("role", "alert");
  });

  it("hands the host the toast and its loading state", async () => {
    const queue = new ToastQueue();
    const received: {isLoading: unknown; title: unknown}[] = [];

    mounted.push(
      renderInterop(ToastProvider, {
        props: {queue},
        slots: {
          default: (slotProps) => {
            const {isLoading, toast} = slotProps as {
              isLoading: boolean;
              toast: {content: {title?: unknown}};
            };

            received.push({isLoading, title: toast.content.title});

            return h("div", {"data-testid": "custom"}, String(toast.content.title));
          },
        },
      }),
    );

    queue.add({isLoading: true, title: "Saving"});
    await settle();

    expect(received).toEqual([{isLoading: true, title: "Saving"}]);
    expect(document.body.querySelector('[data-testid="custom"]')).toHaveTextContent("Saving");
  });

  it("renders the default tree when the host forwards no slot", async () => {
    const queue = new ToastQueue();

    mounted.push(renderInterop(ToastProvider, {props: {queue}}));

    queue.add({description: "All done", title: "Saved"});
    await settle();

    expect(slot("toast-title")).toHaveTextContent("Saved");
    expect(slot("toast-close")).not.toBeNull();
  });
});
