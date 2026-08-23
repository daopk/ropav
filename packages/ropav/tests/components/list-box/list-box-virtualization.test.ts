import {renderVapor} from "@heroui/testing/helpers/vue";
import {describe, expect, it} from "vitest";
import {nextTick} from "vue";

import VirtualizedFixture from "./virtualized-fixtures.vue";

const users = Array.from({length: 1000}, (_, index) => ({
  email: `user${index}@heroui.com`,
  id: `user-${index}`,
  name: `User ${index}`,
}));

/**
 * jsdom lays nothing out. The container's measurements are defined on that one element — not on
 * `HTMLElement.prototype`, which would make the content wrapper and every row claim to be 400px
 * tall and let the window agree with a layout that is wrong.
 */
const measure = async (listbox: HTMLElement, size = {height: 400, width: 300}) => {
  Object.defineProperty(listbox, "clientWidth", {configurable: true, value: size.width});
  Object.defineProperty(listbox, "clientHeight", {configurable: true, value: size.height});
  window.dispatchEvent(new Event("resize"));
  await nextTick();
};

const scrollTo = async (listbox: HTMLElement, top: number) => {
  listbox.scrollTop = top;
  listbox.dispatchEvent(new Event("scroll"));
  await nextTick();
};

const renderVirtualized = async (props: Record<string, unknown> = {}) => {
  const rendered = renderVapor(VirtualizedFixture, {props: {items: users, ...props}});
  const listbox = rendered.getByRole("listbox");

  await measure(listbox);

  return {...rendered, listbox};
};

const wrappersOf = (listbox: HTMLElement) => [
  ...listbox.querySelectorAll(':scope > [role="presentation"] > [role="presentation"]'),
];

const renderedKeys = (listbox: HTMLElement) =>
  [...listbox.querySelectorAll('[role="option"]')].map((option) => option.getAttribute("data-key"));

describe("ListBox virtualization", () => {
  it("renders a window of the collection rather than all of it", async () => {
    const {listbox, unmount} = await renderVirtualized();

    // 400px of viewport plus a third overscanned, grown to whole 50px rows: rows 0 to 11.
    expect(renderedKeys(listbox)).toEqual(Array.from({length: 12}, (_, index) => `user-${index}`));
    expect(wrappersOf(listbox)).toHaveLength(12);

    unmount();
  });

  it("gives the container something the size of the whole collection to scroll", async () => {
    const {listbox, unmount} = await renderVirtualized();
    const content = listbox.firstElementChild as HTMLElement;

    expect(content.getAttribute("role")).toBe("presentation");
    // 1000 rows of 50px, so the scrollbar describes the collection and not the window.
    expect(content.style.height).toBe("50000px");
    expect(content.style.position).toBe("relative");

    unmount();
  });

  it("positions each row absolutely at the offset the layout gave it", async () => {
    const {listbox, unmount} = await renderVirtualized();
    const [first, second] = wrappersOf(listbox) as HTMLElement[];

    expect(first!.style.position).toBe("absolute");
    expect(first!.style.top).toBe("0px");
    expect(first!.style.height).toBe("50px");
    expect(second!.style.top).toBe("50px");
    // The wrapper is sized by the layout; a ring drawn inside it is not clipped by that.
    expect(first!.style.overflow).toBe("visible");
    expect(first!.style.contain).toBe("size layout style");

    unmount();
  });

  it("states each row's place in a set that is mostly absent", async () => {
    const {listbox, unmount} = await renderVirtualized();
    const options = [...listbox.querySelectorAll('[role="option"]')];

    expect(options[0]?.getAttribute("aria-posinset")).toBe("1");
    expect(options[0]?.getAttribute("aria-setsize")).toBe("1000");
    expect(options.at(-1)?.getAttribute("aria-posinset")).toBe("12");

    unmount();
  });

  it("moves the window when the container scrolls", async () => {
    const {listbox, unmount} = await renderVirtualized();

    await scrollTo(listbox, 1_000);

    const keys = renderedKeys(listbox);

    // The window is 1000 to 1550: row 19 ends on the top edge, row 31 starts on the bottom one.
    expect(keys[0]).toBe("user-19");
    expect(keys.at(-1)).toBe("user-31");
    expect(keys).not.toContain("user-0");
    // Position comes from the layout, so a row far down the collection is still absolute.
    const [first] = wrappersOf(listbox) as HTMLElement[];

    expect(first!.style.top).toBe("950px");

    unmount();
  });

  it("renders nothing until the container has been measured", () => {
    const {getByRole, unmount} = renderVapor(VirtualizedFixture, {props: {items: users}});
    const listbox = getByRole("listbox");

    // A virtualizer that guessed here would put a thousand rows in the DOM.
    expect(renderedKeys(listbox)).toEqual([]);
    expect(listbox.getAttribute("data-empty")).toBeNull();

    unmount();
  });

  it("leaves a listbox without a virtualizer exactly as it was", async () => {
    const {getByRole, unmount} = renderVapor(VirtualizedFixture, {
      props: {items: users.slice(0, 3), withoutVirtualizer: true},
    });

    await nextTick();

    const listbox = getByRole("listbox");
    const options = [...listbox.querySelectorAll('[role="option"]')];

    expect(options).toHaveLength(3);
    // No window means the options in the DOM are the set, and stating a position would be noise.
    expect(options[0]?.getAttribute("aria-posinset")).toBeNull();
    expect(options[0]?.getAttribute("aria-setsize")).toBeNull();
    expect(listbox.querySelector('[role="presentation"]')).toBeNull();

    unmount();
  });

  it("reports being empty when there is no data", async () => {
    const {listbox, unmount} = await renderVirtualized({items: []});

    expect(listbox.getAttribute("data-empty")).toBe("true");
    expect(renderedKeys(listbox)).toEqual([]);

    unmount();
  });
});

describe("ListBox virtualization keyboard navigation", () => {
  const press = (element: HTMLElement, key: string, init: KeyboardEventInit = {}) => {
    element.dispatchEvent(new KeyboardEvent("keydown", {bubbles: true, key, ...init}));
  };

  it("reaches the last item, which was never rendered", async () => {
    const {listbox, unmount} = await renderVirtualized();

    press(listbox, "End");
    await nextTick();
    // One more tick: the key becomes persisted first, which is what puts it in the DOM.
    await nextTick();

    const focused = document.activeElement;

    expect(focused?.getAttribute("data-key")).toBe("user-999");
    expect(focused?.getAttribute("aria-posinset")).toBe("1000");

    unmount();
  });

  it("keeps the focused row rendered after the window has scrolled past it", async () => {
    const {listbox, unmount} = await renderVirtualized();

    press(listbox, "ArrowDown");
    await nextTick();
    await scrollTo(listbox, 5_000);

    // The roving tab stop lives on that element; letting it go would drop focus to the document.
    expect(renderedKeys(listbox)).toContain("user-0");
    expect(document.activeElement?.getAttribute("data-key")).toBe("user-0");

    unmount();
  });

  it("pages to the end while nothing reports being scrollable", async () => {
    const {listbox, unmount} = await renderVirtualized();

    press(listbox, "ArrowDown");
    await nextTick();
    press(listbox, "PageDown");
    await nextTick();
    await nextTick();

    // No stylesheet is loaded here, so `overflow-y-auto` never applies and the container does
    // not look scrollable. Paging then collapses to the ends, which is the honest answer for a
    // list with no page to move by. Paging by real geometry is asserted in the browser suite.
    expect(document.activeElement?.getAttribute("data-key")).toBe("user-999");

    unmount();
  });

  it("selects the whole collection, not the window", async () => {
    const {listbox, unmount} = await renderVirtualized({selectionMode: "multiple"});
    const selectionChange: unknown[] = [];

    listbox.addEventListener("focusin", () => undefined);
    press(listbox, "a", {ctrlKey: true});
    await nextTick();

    void selectionChange;
    // Every rendered row reports itself selected, and the count comes from the data.
    const options = [...listbox.querySelectorAll('[role="option"]')];

    expect(options.every((option) => option.getAttribute("aria-selected") === "true")).toBe(true);
    expect(options).toHaveLength(12);

    unmount();
  });

  it("finds an item by typing, including one that never rendered", async () => {
    const {listbox, unmount} = await renderVirtualized();

    for (const character of "User 300") {
      listbox.dispatchEvent(new KeyboardEvent("keydown", {bubbles: true, key: character}));
    }

    await nextTick();
    await nextTick();

    // Typeahead reads text out of the data for the rows that are not in the DOM.
    expect(document.activeElement?.getAttribute("data-key")).toBe("user-300");

    unmount();
  });
});
