import type { PlaygroundSpec } from "../../playgrounds/types.ts";

import { describe, expect, it } from "vitest";

import { renderCode } from "./code.ts";

const spec = (node: PlaygroundSpec["node"]): PlaygroundSpec => ({
  controls: [
    { description: "", kind: "enum", name: "orientation", options: ["horizontal", "vertical"] },
  ],
  id: "probe",
  node,
});

const box = {
  cases: { horizontal: { style: "display: block" }, vertical: { style: "display: flex" } },
  control: "orientation",
};

describe("renderCode", () => {
  it("writes a leaf with no children as a self-closing tag", () => {
    expect(renderCode(spec({ tag: "Separator" }), {})).toBe("<Separator />");
  });

  it("keeps a lone label on the opening line", () => {
    expect(renderCode(spec({ children: ["Publish"], tag: "Button" }), {})).toBe(
      "<Button>Publish</Button>",
    );
  });

  it("indents a nested part by one level", () => {
    const node = { children: [{ tag: "Separator" }], tag: "div" };

    expect(renderCode(spec(node), {})).toBe("<div>\n  <Separator />\n</div>");
  });

  it("writes the case the control's value names", () => {
    const node = { children: [{ tag: "Separator" }], follows: box, tag: "div" };

    expect(renderCode(spec(node), { orientation: "vertical" })).toBe(
      '<div style="display: flex">\n  <Separator />\n</div>',
    );
  });

  it("leaves a followed node bare when the control names no case", () => {
    const node = { children: [{ tag: "Separator" }], follows: box, tag: "div" };

    expect(renderCode(spec(node), { orientation: "diagonal" })).toBe(
      "<div>\n  <Separator />\n</div>",
    );
  });

  it("lets a case override what the node wrote itself", () => {
    const node = { follows: box, props: { style: "display: none" }, tag: "div" };

    expect(renderCode(spec(node), { orientation: "horizontal" })).toBe(
      '<div style="display: block" />',
    );
  });

  describe("a boolean control", () => {
    const withSwitch = (defaultValue?: boolean): PlaygroundSpec => ({
      controls: [{ defaultValue, description: "", kind: "boolean", name: "fullWidth" }],
      id: "probe",
      node: { root: true, tag: "Tabs" },
    });

    it("writes nothing while it holds its default", () => {
      expect(renderCode(withSwitch(true), { fullWidth: true })).toBe("<Tabs />");
      expect(renderCode(withSwitch(), { fullWidth: false })).toBe("<Tabs />");
    });

    it("writes the bare attribute when turned on", () => {
      expect(renderCode(withSwitch(), { fullWidth: true })).toBe("<Tabs full-width />");
    });

    it("binds false when turned off against a true default", () => {
      expect(renderCode(withSwitch(true), { fullWidth: false })).toBe(
        '<Tabs :full-width="false" />',
      );
    });
  });
});
