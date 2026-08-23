import type {Color} from "@/utils/color-types";

import {renderVapor} from "@ropav/testing/helpers/vue";
import {describe, expect, it, vi} from "vitest";
import {nextTick, reactive} from "vue";

import {parseColor} from "@/utils/color";

import Fixture from "./fixtures.vue";

/**
 * Renders and waits one tick.
 *
 * Items register with the collection post-flush, so that they are attached before grid navigation
 * asks the DOM where they sit. Until that has run the picker knows of no items at all — nothing
 * is disabled, nothing is navigable — so every assertion here would be reading a half-built
 * collection.
 */
const renderPicker = async (props: Record<string, unknown> = {}) => {
  const rendered = renderVapor(Fixture, {props});

  await nextTick();

  return rendered;
};

/** The same, named for the case where a test goes on to mutate the props it passed. */
const renderReactive = renderPicker;

const slot = (container: HTMLElement, name: string) =>
  container.querySelector<HTMLElement>(`[data-slot='${name}']`)!;

const optionsIn = (container: HTMLElement) => [
  ...container.querySelectorAll<HTMLElement>("[role='option']"),
];

const optionAt = (container: HTMLElement, index: number) => optionsIn(container)[index]!;

const key = (element: HTMLElement, keyName: string, init: KeyboardEventInit = {}) => {
  element.dispatchEvent(
    new KeyboardEvent("keydown", {bubbles: true, cancelable: true, key: keyName, ...init}),
  );

  return nextTick();
};

describe("ColorSwatchPicker", () => {
  describe("structure", () => {
    it("renders every part with its data-slot and BEM class", async () => {
      const {container, unmount} = await renderPicker();

      expect(slot(container, "color-swatch-picker")).toHaveClass("color-swatch-picker");
      expect(slot(container, "color-swatch-picker-item")).toHaveClass("color-swatch-picker__item");
      expect(slot(container, "color-swatch-picker-swatch")).toHaveClass(
        "color-swatch-picker__swatch",
      );
      expect(slot(container, "color-swatch-picker-indicator")).toHaveClass(
        "color-swatch-picker__indicator",
      );

      unmount();
    });

    it("is the listbox itself rather than wrapping one", async () => {
      // The BEM block and the `role` are on one element: there is no `list-box` block in between,
      // exactly as the React build goes straight to the collection primitive.
      const {container, unmount} = await renderPicker();
      const root = slot(container, "color-swatch-picker");

      expect(root).toHaveAttribute("role", "listbox");
      expect(root).toHaveAttribute("aria-orientation", "vertical");
      expect(root).toHaveAttribute("data-orientation", "vertical");
      expect(container.querySelector("[data-slot='list-box']")).toBeNull();
      expect(root.className).not.toContain("listbox");

      unmount();
    });

    it("renders an option per swatch, keyed by its colour with alpha", async () => {
      const {container, unmount} = await renderPicker();

      expect(optionsIn(container).map((option) => option.dataset["key"])).toEqual([
        "#F43F5EFF",
        "#D946EFFF",
        "#8B5CF6FF",
      ]);

      unmount();
    });

    it("derives an option id from the picker's own", async () => {
      const {container, unmount} = await renderPicker();
      const root = slot(container, "color-swatch-picker");

      expect(optionAt(container, 0)).toHaveAttribute("id", `${root.id}-option-#F43F5EFF`);

      unmount();
    });

    it("marks every option as belonging to one collection", async () => {
      const {container, unmount} = await renderPicker();
      const root = slot(container, "color-swatch-picker");

      for (const option of optionsIn(container)) {
        expect(option).toHaveAttribute("data-collection", root.dataset["collection"]);
        expect(option).toHaveAttribute("data-selection-mode", "single");
      }

      unmount();
    });

    it("renders the default checkmark inside the indicator", async () => {
      const {container, unmount} = await renderPicker();
      const checkmark = slot(container, "color-swatch-picker-checkmark");

      expect(checkmark).toHaveAttribute("aria-hidden", "true");
      expect(checkmark).toHaveAttribute("role", "presentation");
      expect(checkmark.querySelector("polyline")).toHaveAttribute("points", "2.5 6 5 8.5 9.5 3");

      unmount();
    });

    it("lets a caller replace the checkmark", async () => {
      const {container, unmount} = await renderPicker({withCustomIndicator: true});

      expect(container.querySelector("[data-testid='custom-indicator']")).not.toBeNull();
      expect(container.querySelector("[data-slot='color-swatch-picker-checkmark']")).toBeNull();

      unmount();
    });

    it("hides the indicator from the accessibility tree", async () => {
      const {container, unmount} = await renderPicker();

      expect(slot(container, "color-swatch-picker-indicator")).toHaveAttribute(
        "aria-hidden",
        "true",
      );

      unmount();
    });

    it("reports an empty palette", async () => {
      const {container, unmount} = await renderPicker({colors: []});

      expect(slot(container, "color-swatch-picker")).toHaveAttribute("data-empty", "true");

      unmount();
    });

    it("lets a caller's class through to tailwind-merge", async () => {
      const {container, unmount} = await renderPicker({class: "gap-1"});

      expect(slot(container, "color-swatch-picker")).toHaveClass("gap-1");

      unmount();
    });
  });

  describe("variants", () => {
    it("exposes size and shape modifiers", async () => {
      const {container, unmount} = await renderPicker({size: "lg", variant: "square"});
      const root = slot(container, "color-swatch-picker");

      expect(root).toHaveClass("color-swatch-picker--lg");
      expect(root).toHaveClass("color-swatch-picker--square");

      unmount();
    });

    it("turns layout into a class and nothing else", async () => {
      /**
       * A stack is a stack to look at and a grid to navigate, because the React build
       * destructures `layout` out to build the modifier and never forwards it. Mirrored, so
       * `data-layout` stays `"grid"` on both sides.
       */
      const {container, unmount} = await renderPicker({layout: "stack"});
      const root = slot(container, "color-swatch-picker");

      expect(root).toHaveClass("color-swatch-picker--stack");
      expect(root).toHaveAttribute("data-layout", "grid");

      unmount();
    });

    it("defaults to a medium circle grid", async () => {
      const {container, unmount} = await renderPicker();
      const root = slot(container, "color-swatch-picker");

      expect(root).toHaveClass("color-swatch-picker--grid");
      expect(root).toHaveClass("color-swatch-picker--md");
      expect(root).toHaveClass("color-swatch-picker--circle");

      unmount();
    });
  });

  describe("labelling", () => {
    it("names itself when the caller does not", async () => {
      const {container, unmount} = await renderPicker();

      expect(slot(container, "color-swatch-picker")).toHaveAttribute(
        "aria-label",
        "Color swatches",
      );

      unmount();
    });

    it("takes the caller's label instead", async () => {
      const {container, unmount} = await renderPicker({ariaLabel: "Brand palette"});

      expect(slot(container, "color-swatch-picker")).toHaveAttribute("aria-label", "Brand palette");

      unmount();
    });

    it("stays quiet when something else names it", async () => {
      // A generic name alongside a specific one would be read as well as it, not instead of it.
      const {container, unmount} = await renderPicker({ariaLabelledby: "heading"});
      const root = slot(container, "color-swatch-picker");

      expect(root).toHaveAttribute("aria-labelledby", "heading");
      expect(root).not.toHaveAttribute("aria-label");

      unmount();
    });

    it("names each swatch by its colour", async () => {
      const {container, unmount} = await renderPicker();
      const swatch = slot(container, "color-swatch-picker-swatch");

      expect(swatch).toHaveAttribute("role", "img");
      expect(swatch).toHaveAttribute("aria-roledescription", "color swatch");
      expect(swatch).toHaveAttribute("aria-label", "vibrant red");

      unmount();
    });

    it("gives each option a text value for typeahead", async () => {
      const {container, unmount} = await renderPicker();
      const root = slot(container, "color-swatch-picker");

      await key(root, "v");
      await key(root, "i");

      expect(optionAt(container, 0)).toHaveAttribute("tabindex", "0");

      unmount();
    });
  });

  describe("colour", () => {
    it("carries each item's colour as a custom property", async () => {
      // What the item needs the colour for is its selected border, which the stylesheet reads
      // back out of the variable.
      const {container, unmount} = await renderPicker();

      expect(optionAt(container, 0).style.getPropertyValue("--color-swatch-current")).toBe(
        "rgba(244, 63, 94, 1)",
      );

      unmount();
    });

    it("paints the swatch and leaves the variable to the item", async () => {
      const {container, unmount} = await renderPicker();
      const swatch = slot(container, "color-swatch-picker-swatch");

      expect(swatch.style.backgroundColor).toBe("rgb(244, 63, 94)");
      expect(swatch.style.getPropertyValue("forced-color-adjust")).toBe("none");
      expect(swatch.style.getPropertyValue("--color-swatch-current")).toBe("");

      unmount();
    });

    it("keeps a caller's own style beside the variable", async () => {
      /**
       * A recorded divergence: React's item passes its `style` function *after* spreading the
       * caller's props, so the caller's style is dropped and only the variable survives. Here both
       * are kept, which is the Vue convention everywhere else in the colour group — and the only
       * place React does not merge.
       */
      const {container, unmount} = await renderPicker({itemStyle: "outline: 1px solid red"});
      const style = optionAt(container, 0).getAttribute("style");

      expect(style).toContain("--color-swatch-current: rgba(244, 63, 94, 1)");
      expect(style).toContain("outline: 1px solid red");

      unmount();
    });

    it("treats an item with no colour as transparent", async () => {
      const {container, unmount} = await renderPicker({colors: [undefined]});

      expect(optionAt(container, 0)).toHaveAttribute("data-key", "#00000000");
      expect(slot(container, "color-swatch-picker-swatch")).toHaveAttribute(
        "aria-label",
        "transparent",
      );

      unmount();
    });

    it("accepts a parsed colour as well as a string", async () => {
      const {container, unmount} = await renderPicker({colors: [parseColor("hsl(0, 100%, 50%)")]});

      expect(optionAt(container, 0)).toHaveAttribute("data-key", "#FF0000FF");

      unmount();
    });
  });

  describe("selection", () => {
    it("selects nothing when the value is outside the palette", async () => {
      const {container, unmount} = await renderPicker();

      for (const option of optionsIn(container)) {
        expect(option).toHaveAttribute("aria-selected", "false");
        expect(option).not.toHaveAttribute("data-selected");
      }

      unmount();
    });

    it("marks the swatch matching the default value", async () => {
      const {container, unmount} = await renderPicker({defaultValue: "#D946EF"});
      const [, second] = optionsIn(container);

      expect(second).toHaveAttribute("aria-selected", "true");
      expect(second).toHaveAttribute("data-selected", "true");

      unmount();
    });

    it("selects on click and reports the colour", async () => {
      const onChange = vi.fn();
      const {container, unmount} = await renderPicker({onChange});

      optionAt(container, 2).click();
      await nextTick();

      expect(onChange).toHaveBeenCalledTimes(1);
      expect((onChange.mock.calls[0]![0] as Color).toString("hex")).toBe("#8B5CF6");
      expect(optionAt(container, 2)).toHaveAttribute("data-selected", "true");

      unmount();
    });

    it("keeps the selection when the selected swatch is clicked again", async () => {
      // A palette is a palette rather than a set of toggles: there is always one colour.
      const {container, unmount} = await renderPicker({defaultValue: "#F43F5E"});

      optionAt(container, 0).click();
      await nextTick();

      expect(optionAt(container, 0)).toHaveAttribute("data-selected", "true");

      unmount();
    });

    it("follows a controlled value", async () => {
      const props = reactive<Record<string, unknown>>({value: "#F43F5E"});
      const {container, unmount} = await renderReactive(props);

      expect(optionAt(container, 0)).toHaveAttribute("data-selected", "true");

      props["value"] = "#8B5CF6";
      await nextTick();

      expect(optionAt(container, 0)).not.toHaveAttribute("data-selected");
      expect(optionAt(container, 2)).toHaveAttribute("data-selected", "true");

      unmount();
    });

    it("does not move a controlled value by itself", async () => {
      const onChange = vi.fn();
      const props = reactive<Record<string, unknown>>({onChange, value: "#F43F5E"});
      const {container, unmount} = await renderReactive(props);

      optionAt(container, 1).click();
      await nextTick();

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(optionAt(container, 0)).toHaveAttribute("data-selected", "true");
      expect(optionAt(container, 1)).not.toHaveAttribute("data-selected");

      unmount();
    });

    it("selects with Space", async () => {
      const {container, unmount} = await renderPicker({defaultValue: "#F43F5E"});
      const root = slot(container, "color-swatch-picker");

      // The first arrow press enters the collection rather than stepping, so it takes two to
      // reach the swatch beside the selected one.
      await key(root, "ArrowRight");
      await key(optionAt(container, 0), "ArrowRight");
      await key(optionAt(container, 1), " ");

      expect(optionAt(container, 1)).toHaveAttribute("data-selected", "true");
      expect(optionAt(container, 0)).not.toHaveAttribute("data-selected");

      unmount();
    });
  });

  describe("disabled items", () => {
    it("marks a disabled swatch and takes it out of the tab order", async () => {
      const {container, unmount} = await renderPicker({disabled: ["#D946EF"]});
      const [, second] = optionsIn(container);

      expect(second).toHaveAttribute("aria-disabled", "true");
      expect(second).toHaveAttribute("data-disabled", "true");
      expect(second).not.toHaveAttribute("tabindex");

      unmount();
    });

    it("does not select a disabled swatch on click", async () => {
      const onChange = vi.fn();
      const {container, unmount} = await renderPicker({disabled: ["#D946EF"], onChange});

      optionAt(container, 1).click();
      await nextTick();

      expect(onChange).not.toHaveBeenCalled();
      expect(optionAt(container, 1)).not.toHaveAttribute("data-selected");

      unmount();
    });

    it("steps over a disabled swatch with the inline arrows", async () => {
      const {container, unmount} = await renderPicker({disabled: ["#D946EF"]});
      const root = slot(container, "color-swatch-picker");

      await key(root, "ArrowRight");
      await key(root, "ArrowRight");

      expect(optionAt(container, 2)).toHaveAttribute("tabindex", "0");

      unmount();
    });
  });

  describe("keyboard", () => {
    it("is a single tab stop until something inside is focused", async () => {
      const {container, unmount} = await renderPicker();
      const root = slot(container, "color-swatch-picker");

      expect(root).toHaveAttribute("tabindex", "0");
      for (const option of optionsIn(container)) {
        expect(option).toHaveAttribute("tabindex", "-1");
      }

      await key(root, "ArrowRight");

      expect(root).toHaveAttribute("tabindex", "-1");
      expect(optionAt(container, 0)).toHaveAttribute("tabindex", "0");

      unmount();
    });

    it("claims the inline arrows, which a vertical stack leaves to the page", async () => {
      // A grid navigates both axes. This is the one place the layout is observable in jsdom,
      // where the block axis needs geometry there is none of.
      const {container, unmount} = await renderPicker();
      const root = slot(container, "color-swatch-picker");
      const event = new KeyboardEvent("keydown", {
        bubbles: true,
        cancelable: true,
        key: "ArrowRight",
      });

      root.dispatchEvent(event);
      await nextTick();

      expect(event.defaultPrevented).toBe(true);
      expect(optionAt(container, 0)).toHaveAttribute("tabindex", "0");

      unmount();
    });

    it("walks the palette in both inline directions", async () => {
      const {container, unmount} = await renderPicker();
      const root = slot(container, "color-swatch-picker");

      await key(root, "ArrowRight");
      await key(optionAt(container, 0), "ArrowRight");

      expect(optionAt(container, 1)).toHaveAttribute("tabindex", "0");

      await key(optionAt(container, 1), "ArrowLeft");

      expect(optionAt(container, 0)).toHaveAttribute("tabindex", "0");

      unmount();
    });

    it("jumps to the ends", async () => {
      const {container, unmount} = await renderPicker();
      const root = slot(container, "color-swatch-picker");

      await key(root, "End");

      expect(optionAt(container, 2)).toHaveAttribute("tabindex", "0");

      await key(optionAt(container, 2), "Home");

      expect(optionAt(container, 0)).toHaveAttribute("tabindex", "0");

      unmount();
    });

    it("does not wrap at the ends", async () => {
      const {container, unmount} = await renderPicker();
      const root = slot(container, "color-swatch-picker");

      await key(root, "End");
      await key(optionAt(container, 2), "ArrowRight");

      expect(optionAt(container, 2)).toHaveAttribute("tabindex", "0");

      unmount();
    });

    it("enters at the selected swatch", async () => {
      const {container, unmount} = await renderPicker({defaultValue: "#8B5CF6"});
      const root = slot(container, "color-swatch-picker");

      root.dispatchEvent(new FocusEvent("focusin", {bubbles: true}));
      await nextTick();

      expect(optionAt(container, 2)).toHaveAttribute("tabindex", "0");

      unmount();
    });
  });

  describe("interaction states", () => {
    it("reports a hovered swatch", async () => {
      const {container, unmount} = await renderPicker();
      const first = optionAt(container, 0);

      first.dispatchEvent(new PointerEvent("pointerenter", {bubbles: true}));
      await nextTick();

      expect(first).toHaveAttribute("data-hovered", "true");

      first.dispatchEvent(new PointerEvent("pointerleave", {bubbles: true}));
      await nextTick();

      expect(first).not.toHaveAttribute("data-hovered");

      unmount();
    });

    it("reports a focused swatch", async () => {
      const {container, unmount} = await renderPicker();
      const first = optionAt(container, 0);

      first.focus();
      await nextTick();

      expect(first).toHaveAttribute("data-focused", "true");

      unmount();
    });

    it("does not report hover on a disabled swatch", async () => {
      const {container, unmount} = await renderPicker({disabled: ["#F43F5E"]});
      const first = optionAt(container, 0);

      first.dispatchEvent(new PointerEvent("pointerenter", {bubbles: true}));
      await nextTick();

      expect(first).not.toHaveAttribute("data-hovered");

      unmount();
    });
  });

  describe("light colours", () => {
    it("flags an indicator over a light swatch", async () => {
      /**
       * The attribute, not the checkmark's colour: the stylesheet rule that would darken it asks
       * for an indicator nested inside an indicator, so it never matches in either framework.
       * Asserting the colour here would pass for the wrong reason.
       */
      const {container, unmount} = await renderPicker({colors: ["#FFFFFF"]});

      expect(slot(container, "color-swatch-picker-indicator")).toHaveAttribute(
        "data-light-color",
        "true",
      );

      unmount();
    });

    it("leaves a dark swatch unflagged", async () => {
      const {container, unmount} = await renderPicker({colors: ["#000000"]});

      expect(slot(container, "color-swatch-picker-indicator")).not.toHaveAttribute(
        "data-light-color",
      );

      unmount();
    });

    it("weighs green far above blue", async () => {
      // The coefficients are what make this more than a brightness average: pure blue is dark
      // and pure green is light, though both are one channel at full.
      const {container, unmount} = await renderPicker({colors: ["#00FF00", "#0000FF"]});
      const [green, blue] = container.querySelectorAll<HTMLElement>(
        "[data-slot='color-swatch-picker-indicator']",
      );

      expect(green).toHaveAttribute("data-light-color", "true");
      expect(blue).not.toHaveAttribute("data-light-color");

      unmount();
    });

    it("measures a colour given in another space", async () => {
      // The coefficients are defined for red, green and blue, so the colour is converted first.
      const {container, unmount} = await renderPicker({colors: [parseColor("hsl(0, 0%, 100%)")]});

      expect(slot(container, "color-swatch-picker-indicator")).toHaveAttribute(
        "data-light-color",
        "true",
      );

      unmount();
    });
  });
});
