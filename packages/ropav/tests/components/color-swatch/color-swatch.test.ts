import type { Color } from "@/utils/color-types";

import { renderVapor } from "@ropav/testing/helpers/vue";
import { describe, expect, it } from "vitest";
import { nextTick, shallowRef } from "vue";

import { ColorSwatchRoot } from "@/components/color-swatch";
import { parseColor } from "@/utils/color";

const renderSwatch = (props: Record<string, unknown> = {}) => {
  const result = renderVapor(ColorSwatchRoot, { props });
  const swatch = result.container.querySelector<HTMLElement>('[data-slot="color-swatch"]');

  if (!swatch) throw new Error("swatch not rendered");

  return { ...result, swatch };
};

describe("ColorSwatch", () => {
  describe("structure", () => {
    it("renders an image with the slot the stylesheet keys on", () => {
      const { swatch } = renderSwatch({ color: "#0485F7" });

      expect(swatch).toHaveAttribute("role", "img");
      expect(swatch).toHaveAttribute("data-slot", "color-swatch");
      expect(swatch).toHaveClass("color-swatch");
    });

    it("applies the default shape and size, and the modifiers when asked", () => {
      expect(renderSwatch({ color: "#0485F7" }).swatch).toHaveClass(
        "color-swatch--circle",
        "color-swatch--md",
      );
      expect(renderSwatch({ color: "#0485F7", shape: "square", size: "xl" }).swatch).toHaveClass(
        "color-swatch--square",
        "color-swatch--xl",
      );
    });

    it("lets a caller's class through to tailwind-merge", () => {
      const { swatch } = renderSwatch({ class: "size-5", color: "#0485F7" });

      expect(swatch).toHaveClass("color-swatch", "size-5");
    });

    it("renders whatever the slot puts inside it, and hands it the parsed colour", () => {
      let seen: string | undefined;
      const result = renderVapor(ColorSwatchRoot, {
        props: { color: "#0485F7" },
        slots: {
          default: (slotProps?: Record<string, unknown>) => {
            seen = (slotProps?.["color"] as Color).toString("hex");

            return document.createTextNode("inner");
          },
        },
      });

      expect(result.container.textContent).toContain("inner");
      expect(seen).toBe("#0485F7");
    });
  });

  /**
   * The colour is written twice: `background-color` paints, and `--color-swatch-current` is what
   * `.color-swatch` composes into its `background` shorthand over the transparency checkerboard.
   * React ends up with both too, so dropping either would be a divergence.
   */
  describe("colour", () => {
    /**
     * The two are asserted differently on purpose: a custom property is stored verbatim, so it
     * carries the exact `toString("css")` output, while `background-color` is parsed and read back
     * in the engine's own serialization — which is the stronger check that the value is a colour
     * the engine actually understood.
     */
    it("writes the colour as both a property and a custom property", () => {
      const { swatch } = renderSwatch({ color: "#0485F7" });

      expect(swatch.style.backgroundColor).toBe("rgb(4, 133, 247)");
      expect(swatch.style.getPropertyValue("--color-swatch-current")).toBe("rgba(4, 133, 247, 1)");
    });

    it("keeps alpha in both", () => {
      const { swatch } = renderSwatch({ color: "rgba(4, 133, 247, 0.5)" });

      expect(swatch.style.backgroundColor).toBe("rgba(4, 133, 247, 0.5)");
      expect(swatch.style.getPropertyValue("--color-swatch-current")).toBe(
        "rgba(4, 133, 247, 0.5)",
      );
    });

    it("keeps the swatch visible in forced colours", () => {
      // The one thing a swatch exists to show is the thing high contrast would repaint.
      const { swatch } = renderSwatch({ color: "#0485F7" });

      expect(swatch.style.getPropertyValue("forced-color-adjust")).toBe("none");
    });

    it("accepts an already-parsed colour, and keeps its space in the custom property", () => {
      const { swatch } = renderSwatch({ color: parseColor("hsl(210, 50%, 50%)") });

      expect(swatch.style.getPropertyValue("--color-swatch-current")).toBe(
        "hsla(210, 50%, 50%, 1)",
      );
      expect(swatch.style.backgroundColor).toBe("rgb(64, 128, 191)");
    });

    it("is transparent when given no colour", () => {
      const { swatch } = renderSwatch();

      expect(swatch.style.getPropertyValue("--color-swatch-current")).toBe(
        "rgba(255, 255, 255, 0)",
      );
    });

    /** The name follows too, which is the whole colour model running on every change. */
    it("follows the colour when it changes", async () => {
      const color = shallowRef("#0485F7");
      const result = renderVapor(ColorSwatchRoot, {
        props: {
          get color() {
            return color.value;
          },
        },
      });
      const swatch = result.container.querySelector<HTMLElement>('[data-slot="color-swatch"]')!;

      expect(swatch.style.backgroundColor).toBe("rgb(4, 133, 247)");
      expect(swatch).toHaveAttribute("aria-label", "vibrant cyan blue");

      color.value = "#EF4444";
      await nextTick();

      expect(swatch.style.backgroundColor).toBe("rgb(239, 68, 68)");
      expect(swatch).toHaveAttribute("aria-label", "vibrant red");
    });
  });

  describe("accessible name", () => {
    it("describes itself as a colour swatch", () => {
      const { swatch } = renderSwatch({ color: "#0485F7" });

      expect(swatch).toHaveAttribute("aria-roledescription", "color swatch");
    });

    it("names the colour when the caller does not", () => {
      const { swatch } = renderSwatch({ color: "#0485F7" });

      expect(swatch).toHaveAttribute("aria-label", "vibrant cyan blue");
    });

    it("says transparent rather than naming a hue nobody can see", () => {
      const { swatch } = renderSwatch({ color: "rgba(4, 133, 247, 0)" });

      expect(swatch).toHaveAttribute("aria-label", "transparent");
    });

    it("prefers a caller's colour name", () => {
      const { swatch } = renderSwatch({ color: "#0485F7", colorName: "Primary blue" });

      expect(swatch).toHaveAttribute("aria-label", "Primary blue");
    });

    /** The caller's own label is appended, so "Brand" still says which colour it is. */
    it("keeps the colour name alongside a caller's label", () => {
      const { swatch } = renderSwatch({ ariaLabel: "Brand", color: "#0485F7" });

      expect(swatch).toHaveAttribute("aria-label", "vibrant cyan blue, Brand");
    });

    it("puts its own id first when the caller points at a label", () => {
      const { swatch } = renderSwatch({
        ariaLabelledby: "outside",
        color: "#0485F7",
        id: "swatch",
      });

      expect(swatch).toHaveAttribute("aria-labelledby", "swatch outside");
    });

    /** An idref pointing at nothing is worse than no idref at all. */
    it("omits aria-labelledby when the caller gave none", () => {
      const { swatch } = renderSwatch({ color: "#0485F7" });

      expect(swatch).not.toHaveAttribute("aria-labelledby");
    });

    it("takes an id override and mints one otherwise", () => {
      expect(renderSwatch({ color: "#0485F7", id: "mine" }).swatch).toHaveAttribute("id", "mine");
      expect(renderSwatch({ color: "#0485F7" }).swatch.id).toBeTruthy();
    });
  });
});
