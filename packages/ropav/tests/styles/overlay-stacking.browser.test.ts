import { renderVapor } from "@ropav/testing/helpers/vue";
import { afterEach, describe, expect, it } from "vitest";
import { nextTick } from "vue";

import { ToastQueue } from "@/components/toast";

import DropdownFixture from "../components/dropdown/fixtures.vue";
import ModalFixture from "../components/modal/fixtures.vue";
import ToastFixture from "../components/toast/fixtures.vue";

/**
 * A popover and a modal resolve to the same stacking level, and a toast to one above both.
 *
 * The two halves are written in different languages. A popover is positioned from JavaScript and
 * carries its z-index as an inline style, which no stylesheet rule can outrank; a modal's
 * backdrop can only declare its in CSS. They were `100000` and `50`, which put every tooltip and
 * every select's list over an open modal, and nothing in the stylesheet could have fixed it.
 *
 * Equal is what is wanted, not higher: a modal opened from a dropdown has to cover the closing
 * dropdown, and a select opened inside a modal has to render above the modal. Only the portal
 * mount order gives both, and it only gets to decide while the values are equal.
 *
 * That the value is `--rp-z-index-overlay` is something the token tests can see. That both
 * languages arrived at it is not, which is why this reads a mounted popover and a mounted
 * backdrop rather than the stylesheet.
 */

const mounted: { unmount: () => void }[] = [];

afterEach(() => {
  while (mounted.length) mounted.pop()!.unmount();
});

const render = async (component: unknown, props: Record<string, unknown> = {}) => {
  mounted.push(renderVapor(component as never, { props }));

  await nextTick();
  await nextTick();
  await nextTick();
};

const slot = (name: string) => document.body.querySelector<HTMLElement>(`[data-slot="${name}"]`)!;

const stack = (name: string) => getComputedStyle(slot(name)).zIndex;

const token = (name: string) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim();

describe("overlay stacking", () => {
  it("puts an inline-positioned popover on the level the backdrops declare", async () => {
    await render(DropdownFixture, { isOpen: true });
    await render(ModalFixture, { isOpen: true });

    expect({
      backdrop: stack("modal-backdrop"),
      popover: stack("dropdown-popover"),
    }).toEqual({ backdrop: token("--rp-z-index-overlay"), popover: token("--rp-z-index-overlay") });
  });

  it("keeps a toast one level above them", async () => {
    const queue = new ToastQueue();

    await render(ModalFixture, { isOpen: true });
    await render(ToastFixture, { queue });

    queue.add({ title: "Saved" });
    while (!document.body.querySelector('[data-slot="toast-region"]')) {
      await new Promise((resolve) => requestAnimationFrame(resolve));
    }

    expect(Number(stack("toast-region"))).toBe(Number(stack("modal-backdrop")) + 1);
  });
});
