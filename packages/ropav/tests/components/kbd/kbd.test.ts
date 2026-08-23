import {renderVapor} from "@ropav/testing/helpers/vue";
import {describe, expect, it} from "vitest";

import {KbdAbbr} from "@/components/kbd";

import Fixture from "./fixtures.vue";

const renderKbd = (props: Record<string, unknown> = {}) => {
  const result = renderVapor(Fixture, {props});
  const kbd = result.container.querySelector("kbd");

  if (!kbd) throw new Error("kbd not rendered");

  return {
    ...result,
    abbrs: [...kbd.querySelectorAll("abbr")],
    content: kbd.querySelector("span"),
    kbd,
  };
};

describe("Kbd", () => {
  describe("root", () => {
    it("renders a kbd element", () => {
      const {kbd} = renderKbd();

      expect(kbd.tagName).toBe("KBD");
      expect(kbd).toHaveClass("kbd");
    });

    it("merges a caller class", () => {
      const {kbd} = renderKbd({class: "ms-auto"});

      expect(kbd).toHaveClass("kbd", "ms-auto");
    });

    it.each(["default", "light"] as const)("renders the %s variant", (variant) => {
      const {kbd} = renderKbd({variant});

      expect(kbd).toHaveClass(`kbd--${variant}`);
    });
  });

  describe("abbr", () => {
    it("shows the symbol and spells the key out in the title", () => {
      // The visible glyph is unreadable to a screen reader, which is the whole reason this
      // is an `abbr` with a title rather than plain text.
      const {abbrs} = renderKbd({keys: ["command"]});

      expect(abbrs[0]).toHaveTextContent("⌘");
      expect(abbrs[0]).toHaveAttribute("title", "Command");
      expect(abbrs[0]).toHaveClass("kbd__abbr");
    });

    it.each([
      ["shift", "⇧", "Shift"],
      ["ctrl", "⌃", "Control"],
      ["capslock", "⇪", "Caps Lock"],
      ["pagedown", "⇟", "Page Down"],
    ] as const)("maps %s to its symbol and label", (key, symbol, label) => {
      const {abbrs} = renderKbd({keys: [key]});

      expect(abbrs[0]).toHaveTextContent(symbol);
      expect(abbrs[0]).toHaveAttribute("title", label);
    });

    it("renders one abbr per key, in order", () => {
      const {abbrs} = renderKbd({keys: ["command", "shift"]});

      expect(abbrs.map((abbr) => abbr.getAttribute("title"))).toEqual(["Command", "Shift"]);
    });
  });

  describe("content", () => {
    it("renders the literal key next to the modifiers", () => {
      const {content} = renderKbd({keys: ["command"], text: "N"});

      expect(content).toHaveTextContent("N");
      expect(content).toHaveClass("kbd__content");
    });
  });

  describe("context", () => {
    it("refuses to render a part outside a root", () => {
      // The parts take their classes from the root's slots rather than recomputing them, so
      // standing alone is a mistake worth failing loudly on rather than rendering unstyled.
      expect(() => renderVapor(KbdAbbr, {props: {keyValue: "command"}})).toThrow(/KbdContext/);
    });
  });
});
