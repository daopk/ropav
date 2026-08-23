import {describe, expect, it} from "vitest";
import {VaporFragment, createComponent, defineVaporComponent} from "vue";

import {flattenBlock, isTextOnlyBlock} from "@/utils/block";

const text = (value: string) => document.createTextNode(value);
const element = (tag: string) => document.createElement(tag);

describe("flattenBlock", () => {
  describe("shapes", () => {
    it("reads a single node", () => {
      const node = text("Label");

      expect(flattenBlock(node)).toEqual([node]);
    });

    it("reads an array in order", () => {
      const icon = element("svg");
      const label = text("Label");

      expect(flattenBlock([icon, label])).toEqual([icon, label]);
    });

    it("reads a fragment's nodes", () => {
      const label = text("Label");

      expect(flattenBlock(new VaporFragment(label))).toEqual([label]);
    });

    it("reads a component's block", () => {
      const label = text("Label");
      const Component = defineVaporComponent(() => label);

      expect(flattenBlock(createComponent(Component))).toEqual([label]);
    });

    it("flattens nesting of every kind", () => {
      const icon = element("svg");
      const label = text("Label");

      expect(flattenBlock([new VaporFragment([icon]), [label]])).toEqual([icon, label]);
    });
  });

  describe("nothing to read", () => {
    it.each([
      ["undefined", undefined],
      ["null", null],
      ["an empty array", []],
      ["a fragment holding nothing", new VaporFragment([])],
    ])("returns no nodes for %s", (_label, block) => {
      expect(flattenBlock(block)).toEqual([]);
    });
  });
});

describe("isTextOnlyBlock", () => {
  it("accepts a single text node", () => {
    expect(isTextOnlyBlock([text("Label")])).toBe(true);
  });

  it("accepts several text nodes", () => {
    expect(isTextOnlyBlock([text("24"), text(" left")])).toBe(true);
  });

  it("accepts an empty string, which is still text", () => {
    // React wraps `{""}` too, so emptiness of the text is not the question being asked.
    expect(isTextOnlyBlock([text("")])).toBe(true);
  });

  it("rejects an element", () => {
    expect(isTextOnlyBlock([element("svg")])).toBe(false);
  });

  it("rejects text mixed with an element", () => {
    expect(isTextOnlyBlock([element("svg"), text("Label")])).toBe(false);
  });

  it("rejects a comment, which is what an anchor leaves behind", () => {
    expect(isTextOnlyBlock([document.createComment("if")])).toBe(false);
  });

  it("rejects nothing at all", () => {
    expect(isTextOnlyBlock([])).toBe(false);
  });
});
