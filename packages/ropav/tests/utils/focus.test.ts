import {describe, expect, it} from "vitest";

import {FOCUSABLE_SELECTOR, createFocusManager, focusableIn, isElementVisible} from "@/utils/focus";

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

    it("leaves out a hidden control", () => {
      // A field's hidden input sits beside its segments, and no browser will focus one.
      const container = build(`<span tabindex="0">mm</span><input hidden />`);

      expect(focusableIn(container).map((el) => el.tagName)).toEqual(["SPAN"]);
    });
  });

  describe("isElementVisible", () => {
    it("counts an element when the platform cannot answer", () => {
      // jsdom implements neither `checkVisibility` nor layout, so the fallback has to be
      // permissive or every key-order test would see an empty collection.
      const element = document.createElement("button");

      expect(isElementVisible(element)).toBe(true);
    });

    it("rules out a hidden element even where the platform cannot answer", () => {
      /*
       * No browser will focus one, and a field's hidden input sits among the segments a picker
       * moves focus through — landing on it would leave focus where it was instead of moving on.
       */
      const element = document.createElement("input");

      element.hidden = true;

      expect(isElementVisible(element)).toBe(false);
    });

    it("defers to checkVisibility when the platform provides it", () => {
      const element = document.createElement("button");

      element.checkVisibility = () => false;

      expect(isElementVisible(element)).toBe(false);
    });
  });

  describe("createFocusManager", () => {
    /** Three tab stops in a row, which is the shape of a field of date segments. */
    const row = () => {
      const container = build(`
        <span tabindex="0" id="first">mm</span>
        <span>/</span>
        <span tabindex="0" id="second">dd</span>
        <span>/</span>
        <span tabindex="0" id="third">yyyy</span>
      `);

      return {
        active: () => document.activeElement?.id,
        container,
        manager: createFocusManager(() => container),
      };
    };

    it("moves to each end", () => {
      const {active, manager} = row();

      expect(manager.focusFirst()?.id).toBe("first");
      expect(active()).toBe("first");
      expect(manager.focusLast()?.id).toBe("third");
      expect(active()).toBe("third");
    });

    it("steps from whatever holds focus", () => {
      const {active, manager} = row();

      manager.focusFirst();
      manager.focusNext();
      expect(active()).toBe("second");
      manager.focusNext();
      expect(active()).toBe("third");
      manager.focusPrevious();
      expect(active()).toBe("second");
    });

    it("skips whatever is not a stop", () => {
      // The separators between segments are not focusable, so one arrow press crosses them.
      const {active, manager} = row();

      manager.focusFirst();
      manager.focusNext();

      expect(active()).toBe("second");
    });

    it("stops at the ends", () => {
      const {active, manager} = row();

      manager.focusLast();
      expect(manager.focusNext()).toBeNull();
      expect(active()).toBe("third");

      manager.focusFirst();
      expect(manager.focusPrevious()).toBeNull();
      expect(active()).toBe("first");
    });

    it("continues at the other end when asked to wrap", () => {
      const {manager} = row();

      manager.focusLast();
      expect(manager.focusNext({wrap: true})?.id).toBe("first");
      expect(manager.focusPrevious({wrap: true})?.id).toBe("third");
    });

    it("starts at an end when focus is elsewhere", () => {
      const {manager} = row();
      const outside = document.createElement("button");

      document.body.appendChild(outside);
      outside.focus();

      expect(manager.focusNext()?.id).toBe("first");

      outside.focus();
      expect(manager.focusPrevious()?.id).toBe("third");
      outside.remove();
    });

    it("moves from a given element rather than from focus", () => {
      const {container, manager} = row();
      const second = container.querySelector<HTMLElement>("#second")!;

      manager.focusFirst();

      expect(manager.focusNext({from: second})?.id).toBe("third");
    });

    it("does nothing before its root exists", () => {
      // The manager is built while the element is still null, which is the order a component
      // sets things up in.
      const manager = createFocusManager(() => null);

      expect(manager.focusFirst()).toBeNull();
      expect(manager.focusLast()).toBeNull();
      expect(manager.focusNext()).toBeNull();
      expect(manager.focusPrevious()).toBeNull();
    });
  });
});
