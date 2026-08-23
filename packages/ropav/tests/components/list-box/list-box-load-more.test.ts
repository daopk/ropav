import { renderVapor } from "@ropav/testing/helpers/vue";
import { afterEach, describe, expect, it } from "vitest";
import { nextTick } from "vue";

import Fixture from "./load-more-fixtures.vue";

const cleanups: Array<() => void> = [];

afterEach(() => {
  while (cleanups.length > 0) cleanups.pop()?.();
});

const render = async (props: Record<string, unknown> = {}) => {
  const result = renderVapor(Fixture, { props });

  cleanups.push(result.unmount);

  await nextTick();

  const listbox = result.container.querySelector<HTMLElement>('[data-slot="list-box"]')!;

  return {
    ...result,
    items: () => [...listbox.querySelectorAll<HTMLElement>('[data-slot="list-box-item"]')],
    listbox,
    options: () => [...listbox.querySelectorAll<HTMLElement>('[role="option"]')],
    sentinel: () => listbox.querySelector<HTMLElement>("[inert]"),
  };
};

const press = (element: Element, key: string) => {
  element.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key }));
};

describe("ListBox load more item", () => {
  describe("the sentinel", () => {
    it("is rendered whether or not a page is on its way", async () => {
      const idle = await render();

      // Always there: a sentinel that is absent can never report coming into view, so the next
      // page would never be asked for.
      expect(idle.sentinel()).not.toBeNull();

      const loading = await render({ isLoading: true });

      expect(loading.sentinel()).not.toBeNull();
    });

    it("takes no room and no focus", async () => {
      const { sentinel } = await render();

      expect(sentinel()).toHaveAttribute("inert");
      expect(sentinel()!.style.width).toBe("0px");
      expect(sentinel()!.style.height).toBe("0px");
    });
  });

  describe("the loading row", () => {
    it("appears only while a page is on its way", async () => {
      const idle = await render();

      expect(idle.screen.queryByTestId("loading")).toBeNull();

      const loading = await render({ isLoading: true });

      expect(loading.screen.queryAllByTestId("loading")).toHaveLength(1);
    });

    it("is an option that cannot be tabbed to", async () => {
      const { listbox } = await render({ isLoading: true });

      const row = listbox.querySelector('[role="option"]:not([data-slot="list-box-item"])')!;

      expect(row).toHaveAttribute("tabindex", "-1");
      expect(row).not.toHaveAttribute("aria-selected");
    });
  });

  describe("the collection", () => {
    it("does not take the loading row as an option to navigate to", async () => {
      const { items, options } = await render({ isLoading: true });

      // The row carries `role="option"` exactly as upstream does, so it is one more than the
      // collection holds.
      expect(options()).toHaveLength(4);
      expect(items()).toHaveLength(3);

      const last = items()[2]!;

      last.focus();
      press(last, "ArrowDown");
      await nextTick();

      // Arrowing off the end stops on the last real option rather than landing on the loader.
      expect(last).toHaveFocus();
    });
  });
});
