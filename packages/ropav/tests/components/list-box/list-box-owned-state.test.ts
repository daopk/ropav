import {renderVapor} from "@ropav/testing/helpers/vue";
import {describe, expect, it, vi} from "vitest";
import {nextTick} from "vue";

import Fixture from "./owned-fixtures.vue";

const render = async (props: Record<string, unknown> = {}) => {
  const result = renderVapor(Fixture, {props});

  // Items register post-flush, so the collection is only complete after a tick.
  await nextTick();

  const listbox = result.container.querySelector('[data-slot="list-box"]')!;

  return {
    ...result,
    items: () => [...listbox.querySelectorAll<HTMLElement>('[role="option"]')],
    listbox,
  };
};

const press = (element: Element, key: string) => {
  element.dispatchEvent(new KeyboardEvent("keydown", {bubbles: true, cancelable: true, key}));
};

const hover = (element: Element) => {
  element.dispatchEvent(new PointerEvent("pointerenter", {bubbles: false}));
};

describe("ListBox driven from above", () => {
  describe("state", () => {
    it("selects into the owner's selection rather than one of its own", async () => {
      const onSelectionChange = vi.fn();
      const {items} = await render({onSelectionChange});

      items()[1]!.click();
      await nextTick();

      expect(onSelectionChange).toHaveBeenCalledTimes(1);
      expect([...onSelectionChange.mock.calls[0]![0]]).toEqual(["2"]);
      expect(items()[1]).toHaveAttribute("data-selected", "true");
    });

    it("reads a selection the owner started with", async () => {
      const {items} = await render({defaultSelectedKeys: ["3"]});

      expect(items()[2]).toHaveAttribute("aria-selected", "true");
    });

    it("announces the owner's selection mode", async () => {
      const {listbox} = await render({selectionMode: "multiple"});

      expect(listbox).toHaveAttribute("aria-multiselectable", "true");
    });

    it("knows a collection the owner built from data with nothing rendered", async () => {
      const {items, listbox} = await render({fromData: true, renderItems: false});

      // The whole point of a data collection: it answers for items that never rendered. A
      // registry built from the DOM would call this listbox empty, which is exactly what a
      // picker cannot afford while its popover is closed.
      expect(items()).toHaveLength(0);
      expect(listbox).not.toHaveAttribute("data-empty");
    });

    it("calls a DOM collection with nothing rendered empty", async () => {
      const {listbox} = await render({renderItems: false});

      expect(listbox).toHaveAttribute("data-empty", "true");
    });

    it("navigates a collection the owner built from data", async () => {
      const {items} = await render({fromData: true});

      items()[0]!.focus();
      press(items()[0]!, "ArrowDown");
      await nextTick();

      expect(items()[1]).toHaveFocus();
    });
  });

  describe("labelling", () => {
    it("takes the id the owner named it by", async () => {
      const {listbox} = await render({listId: "owner-listbox"});

      expect(listbox).toHaveAttribute("id", "owner-listbox");
    });

    it("keeps an id of its own when the owner names none", async () => {
      const {listbox} = await render();

      expect(listbox.getAttribute("id")).toBeTruthy();
      expect(listbox).not.toHaveAttribute("aria-labelledby");
    });

    it("points aria-labelledby at the element the owner named", async () => {
      const {listbox} = await render({labelledBy: "owner-label"});

      expect(listbox).toHaveAttribute("aria-labelledby", "owner-label");
    });
  });

  describe("focus", () => {
    it("focuses the first option when the owner asks for it", async () => {
      const {items} = await render({autoFocus: "first"});

      // The auto focus waits a tick behind the element for the items to register.
      await nextTick();
      await nextTick();

      expect(items()[0]).toHaveFocus();
    });

    it("focuses the selected option over the end the owner asked for", async () => {
      const {items} = await render({autoFocus: "first", defaultSelectedKeys: ["3"]});

      await nextTick();
      await nextTick();

      expect(items()[2]).toHaveFocus();
    });

    it("leaves focus alone when the owner asks for nothing", async () => {
      const {items} = await render();

      await nextTick();
      await nextTick();

      expect(items()[0]).not.toHaveFocus();
    });
  });

  describe("virtual focus", () => {
    it("takes itself out of the tab order entirely", async () => {
      const {items, listbox} = await render({shouldUseVirtualFocus: true});

      expect(listbox).not.toHaveAttribute("tabindex");
      items().forEach((item) => expect(item).not.toHaveAttribute("tabindex"));
    });

    it("rings the option the owner focused, with the caret left outside", async () => {
      const {getByTestId, items} = await render({focusedKey: "2", shouldUseVirtualFocus: true});
      const outside = getByTestId("outside");

      outside.focus();
      await nextTick();

      expect(items()[1]).toHaveAttribute("data-focused", "true");
      expect(items()[1]).toHaveAttribute("data-focus-visible", "true");
      // Asserted alongside, because the ring would look right with real focus quietly moving too.
      expect(outside).toHaveFocus();
    });

    it("rings one option at a time", async () => {
      const {items} = await render({focusedKey: "2", shouldUseVirtualFocus: true});

      expect(items()[0]).not.toHaveAttribute("data-focused");
      expect(items()[2]).not.toHaveAttribute("data-focused");
    });

    it("focuses the option the owner focused when focus is real", async () => {
      const {items} = await render({focusedKey: "2"});

      // The counterpart of the case above, and the reason both are here: the same owner writing
      // the same key moves the caret onto the option without virtual focus, and must not with it.
      expect(items()[1]).toHaveFocus();
    });

    it("stays a tab stop with real focus", async () => {
      const {listbox} = await render();

      expect(listbox).toHaveAttribute("tabindex", "0");
    });
  });

  describe("hover", () => {
    it("moves focus to a hovered option when the owner asks for it", async () => {
      const {items} = await render({shouldFocusOnHover: true});

      hover(items()[1]!);
      await nextTick();

      expect(items()[1]).toHaveFocus();
    });

    it("leaves focus alone on hover by default", async () => {
      const {items} = await render();

      hover(items()[1]!);
      await nextTick();

      expect(items()[1]).not.toHaveFocus();
    });
  });
});
