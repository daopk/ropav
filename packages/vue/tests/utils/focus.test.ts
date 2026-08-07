import {describe, expect, it} from "vitest";

import {FOCUSABLE_SELECTOR, focusableIn, isElementVisible} from "@/utils/focus";

const build = (html: string) => {
  const container = document.createElement("div");

  container.innerHTML = html;
  document.body.appendChild(container);

  return container;
};

describe("focus utils", () => {
  describe("FOCUSABLE_SELECTOR", () => {
    it("excludes a tabindex of -1", () => {
      // Such an element is focusable programmatically but is not a tab stop, so counting it
      // would make one arrow press appear to land nowhere.
      expect(FOCUSABLE_SELECTOR).toContain('[tabindex]:not([tabindex="-1"])');
    });
  });

  describe("focusableIn", () => {
    it("returns focusable controls in document order", () => {
      const container = build(`
        <a href="#one">one</a>
        <button>two</button>
        <input />
        <select></select>
        <textarea></textarea>
      `);

      expect(focusableIn(container).map((el) => el.tagName)).toEqual([
        "A",
        "BUTTON",
        "INPUT",
        "SELECT",
        "TEXTAREA",
      ]);
    });

    it("skips disabled controls", () => {
      const container = build(`<button>a</button><button disabled>b</button>`);

      expect(focusableIn(container)).toHaveLength(1);
    });

    it("skips a link with no href, which is not focusable", () => {
      const container = build(`<a>a</a><a href="#b">b</a>`);

      expect(focusableIn(container)).toHaveLength(1);
    });

    it("skips an element parked out of the tab order", () => {
      const container = build(`<div tabindex="0">a</div><div tabindex="-1">b</div>`);

      expect(focusableIn(container)).toHaveLength(1);
    });

    it("reaches nested controls", () => {
      const container = build(`<div><span><button>deep</button></span></div>`);

      expect(focusableIn(container)).toHaveLength(1);
    });
  });

  describe("isElementVisible", () => {
    it("counts an element when the platform cannot answer", () => {
      // jsdom implements neither `checkVisibility` nor layout, so the fallback has to be
      // permissive or every key-order test would see an empty collection.
      const element = document.createElement("button");

      expect(isElementVisible(element)).toBe(true);
    });

    it("defers to checkVisibility when the platform provides it", () => {
      const element = document.createElement("button");

      element.checkVisibility = () => false;

      expect(isElementVisible(element)).toBe(false);
    });
  });
});
