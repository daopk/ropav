import { describe, expect, it } from "vitest";

import { sortByDocumentOrder } from "@/utils/document-order";

const mount = (count: number) => {
  const parent = document.createElement("div");
  const children = Array.from({ length: count }, (_, index) => {
    const child = document.createElement("div");

    child.dataset["index"] = String(index);
    parent.append(child);

    return child;
  });

  document.body.append(parent);

  return { children, parent };
};

const indexes = (entries: { element: HTMLElement | null }[]) =>
  sortByDocumentOrder(entries, (entry) => entry.element).map(
    (entry) => entry.element!.dataset["index"],
  );

describe("sortByDocumentOrder", () => {
  it("puts the entries in the order their elements appear", () => {
    const { children } = mount(3);
    // Registered back to front, so document order is the only thing that could produce 0,1,2.
    const entries = [children[2]!, children[0]!, children[1]!].map((element) => ({ element }));

    expect(indexes(entries)).toEqual(["0", "1", "2"]);
  });

  it("follows the elements when the DOM moves them", () => {
    const { children, parent } = mount(3);
    const entries = children.map((element) => ({ element }));

    parent.prepend(children[2]!);

    expect(indexes(entries)).toEqual(["2", "0", "1"]);
  });

  /*
   * A detached node compares as DISCONNECTED in both directions, which makes the comparator
   * non-transitive — enough to throw inside the engine's sort on some shapes. Dropping it first is
   * what keeps the comparison total, so this is the case the filter exists for.
   */
  it("drops an entry whose element has left the document", () => {
    const { children } = mount(3);
    const entries = children.map((element) => ({ element }));

    children[1]!.remove();

    expect(indexes(entries)).toEqual(["0", "2"]);
  });

  it("drops an entry with no element at all", () => {
    const { children } = mount(2);
    const entries = [{ element: null }, ...children.map((element) => ({ element }))];

    expect(indexes(entries)).toEqual(["0", "1"]);
  });

  it("holds the order over a longer list, where a partial comparator would show", () => {
    const { children } = mount(12);
    const entries = [...children].reverse().map((element) => ({ element }));

    expect(indexes(entries)).toEqual(children.map((_, index) => String(index)));
  });
});
