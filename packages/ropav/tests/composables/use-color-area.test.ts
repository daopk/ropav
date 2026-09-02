import type { ColorAreaHarnessProps } from "../fixtures/color-area.types";
import type { UseColorAreaReturn } from "@/composables/use-color-area";
import type { ColorAreaState } from "@/composables/use-color-area-state";

import { renderVapor } from "@ropav/testing/helpers/vue";
import { describe, expect, it, vi } from "vitest";
import { nextTick } from "vue";

import Harness from "../fixtures/color-area-harness.vue";

const setup = (props: Partial<ColorAreaHarnessProps> = {}) => {
  let area!: UseColorAreaReturn;
  let state!: ColorAreaState;

  const rendered = renderVapor(Harness, {
    props: {
      ...props,
      onReady: (ready) => {
        area = ready.area;
        state = ready.state;
      },
    } satisfies ColorAreaHarnessProps,
  });

  const el = (testid: string) =>
    rendered.container.querySelector<HTMLElement>(`[data-testid='${testid}']`)!;

  return { ...rendered, area, el, state };
};

const key = (element: HTMLElement, keyName: string, init: KeyboardEventInit = {}) => {
  element.dispatchEvent(
    new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: keyName, ...init }),
  );

  return nextTick();
};

describe("useColorArea", () => {
  describe("the gradient", () => {
    it("stacks three blended layers in rgb", () => {
      const { area, unmount } = setup();

      // Three layers joined by a bare comma — the other two spaces have a space after it, and the
      // string is compared byte for byte against React.
      expect(area.areaStyle.value.background).toBe(
        "linear-gradient(to right, rgba(0, 0, 0, 1), rgba(255, 0, 0, 1))," +
          "linear-gradient(to top, rgba(0, 0, 0, 1), rgba(0, 255, 0, 1))," +
          "rgba(0, 0, 255, 1)",
      );
      // Load-bearing: without it the top layer covers the others and the result still looks like a
      // plausible colour square.
      expect(area.areaStyle.value.backgroundBlendMode).toBe("screen");

      unmount();
    });

    it("holds the third channel at its current value in rgb", () => {
      const { area, unmount } = setup({
        defaultValue: "rgb(50, 100, 255)",
        xChannel: "blue",
        yChannel: "green",
      });

      expect(area.areaStyle.value.background).toBe(
        "linear-gradient(to right, rgba(0, 0, 0, 1), rgba(0, 0, 255, 1))," +
          "linear-gradient(to top, rgba(0, 0, 0, 1), rgba(0, 255, 0, 1))," +
          "rgba(50, 0, 0, 1)",
      );

      unmount();
    });

    it("paints hue across and saturation up in hsl, with no layer under them", () => {
      const { area, unmount } = setup({ defaultValue: "hsl(30, 100%, 50%)" });

      // Reversed, so the x axis ends up underneath; and no flat colour is pushed, because the
      // held channel is the lightness rather than the hue.
      expect(area.areaStyle.value.background).toBe(
        "linear-gradient(to top, hsla(0, 0%, 50%, 1), transparent), " +
          "linear-gradient(to right, hsla(0, 100%, 50%, 1), hsla(60, 100%, 50%, 1), " +
          "hsla(120, 100%, 50%, 1), hsla(180, 100%, 50%, 1), hsla(240, 100%, 50%, 1), " +
          "hsla(300, 100%, 50%, 1), hsla(360, 100%, 50%, 1))",
      );
      expect(area.areaStyle.value.backgroundBlendMode).toBeUndefined();

      unmount();
    });

    it("pushes a flat colour beneath both layers when the hue is the one held", () => {
      const { area, unmount } = setup({
        defaultValue: "hsl(30, 100%, 50%)",
        xChannel: "saturation",
        yChannel: "lightness",
      });

      // Both gradients fade to transparent, so with the hue held there would otherwise be nothing
      // behind them to show through.
      expect(area.areaStyle.value.background).toBe(
        "linear-gradient(to top, black, transparent, white), " +
          "linear-gradient(to right, hsla(30, 0%, 50%, 1), transparent), " +
          "hsla(30, 100%, 50%, 1)",
      );

      unmount();
    });

    it("uses the hsb table in hsb, which is not the hsl one", () => {
      const defaults = setup({ defaultValue: "hsb(30, 100%, 100%)" });

      // Saturation fades from *white* here rather than from grey, because the starting point of an
      // hsb gradient is `hsb(0, 100%, 100%)`.
      expect(defaults.area.areaStyle.value.background).toBe(
        "linear-gradient(to top, hsla(0, 0%, 100%, 1), transparent), " +
          "linear-gradient(to right, hsla(0, 100%, 50%, 1), hsla(60, 100%, 50%, 1), " +
          "hsla(120, 100%, 50%, 1), hsla(180, 100%, 50%, 1), hsla(240, 100%, 50%, 1), " +
          "hsla(300, 100%, 50%, 1), hsla(360, 100%, 50%, 1))",
      );
      defaults.unmount();

      const axes = setup({
        defaultValue: "hsb(30, 80%, 60%)",
        xChannel: "saturation",
        yChannel: "brightness",
      });

      // Brightness is black-to-transparent with two stops, where hsl's lightness has three.
      expect(axes.area.areaStyle.value.background).toBe(
        "linear-gradient(to top, black, transparent), " +
          "linear-gradient(to right, hsla(30, 0%, 100%, 1), transparent), " +
          "hsla(30, 100%, 50%, 1)",
      );
      axes.unmount();
    });

    it("turns the x axis around in a right-to-left locale", () => {
      const { area, unmount } = setup({ defaultValue: "hsl(30, 100%, 50%)", locale: "he-IL" });

      expect(area.areaStyle.value.background).toContain("linear-gradient(to left,");
      // The y axis is not a reading direction, so it stays put.
      expect(area.areaStyle.value.background).toContain("linear-gradient(to top,");

      unmount();
    });

    it("keeps the area's own layout under the gradient", () => {
      const { area, unmount } = setup();

      expect(area.areaStyle.value).toMatchObject({
        forcedColorAdjust: "none",
        position: "relative",
        touchAction: "none",
      });

      unmount();
    });
  });

  describe("the thumb", () => {
    it("sits at the fraction of each axis the value works out to", () => {
      const { area, unmount } = setup({ defaultValue: "hsl(30, 100%, 50%)" });

      expect(area.thumbStyle.value).toMatchObject({
        left: "8.333333333333332%",
        position: "absolute",
        top: "0%",
        transform: "translate(-50%, -50%)",
      });

      unmount();
    });

    it("counts y from the top", () => {
      const { area, unmount } = setup({
        defaultValue: "rgb(255, 100, 50)",
        xChannel: "red",
        yChannel: "green",
      });

      expect(area.thumbStyle.value.left).toBe("100%");
      expect(area.thumbStyle.value.top).toBe("60.7843137254902%");

      unmount();
    });

    it("mirrors its x position in a right-to-left locale", () => {
      const { area, unmount } = setup({ defaultValue: "hsl(90, 100%, 50%)", locale: "he-IL" });

      // 90 of 360 is a quarter along, which in a mirrored area is three quarters from the left.
      expect(area.thumbStyle.value.left).toBe("75%");

      unmount();
    });

    it("carries the role that keeps it out of the accessibility tree", () => {
      const { area, unmount } = setup();

      // The two inputs inside it are the controls; the thumb is only what a pointer grabs.
      expect(area.thumbAttrs.role).toBe("presentation");

      unmount();
    });
  });

  describe("labelling", () => {
    it("names the area as a group, and both inputs as the same one control", () => {
      const { area, unmount } = setup();

      expect(area.areaAttrs.value.role).toBe("group");
      // Nothing to name it with, so the area itself stays unnamed while the inputs carry the name.
      expect(area.areaAttrs.value["aria-label"]).toBeUndefined();
      expect(area.xInputProps.value["aria-label"]).toBe("Color picker");
      expect(area.yInputProps.value["aria-label"]).toBe("Color picker");
      expect(area.xInputProps.value["aria-roledescription"]).toBe("2D slider");

      unmount();
    });

    it("folds a caller's label into the area's name and into both inputs'", () => {
      const { area, unmount } = setup({ ariaLabel: "Pick a colour" });

      expect(area.areaAttrs.value["aria-label"]).toBe("Pick a colour, Color picker");
      expect(area.xInputProps.value["aria-label"]).toBe("Pick a colour, Color picker");

      unmount();
    });

    it("gives each input its own id under the area's", () => {
      const { area, unmount } = setup({ id: "the-area" });

      expect(area.areaAttrs.value.id).toBe("the-area");
      expect(area.xInputProps.value.id).toBe("the-area-x");
      expect(area.yInputProps.value.id).toBe("the-area-y");

      unmount();
    });

    it("puts an input's own id first when something else names it too", () => {
      const { area, unmount } = setup({ ariaLabelledby: "elsewhere", id: "the-area" });

      // `aria-labelledby` wins over `aria-label`, so without this the input's own label is dropped.
      expect(area.xInputProps.value["aria-labelledby"]).toBe("the-area-x elsewhere");

      unmount();
    });
  });

  describe("the two hidden inputs", () => {
    it("carries each axis's own channel range", () => {
      const { area, unmount } = setup({ defaultValue: "hsl(30, 100%, 50%)" });

      expect(area.xInputProps.value).toMatchObject({
        "aria-orientation": "horizontal",
        max: 360,
        min: 0,
        step: 1,
        type: "range",
        value: 30,
      });
      expect(area.yInputProps.value).toMatchObject({
        "aria-orientation": "vertical",
        max: 100,
        min: 0,
        step: 1,
        value: 100,
      });

      unmount();
    });

    it("leaves only one of the two reachable, so one control is listed rather than two", () => {
      const { area, unmount } = setup();

      // Nothing focused yet: x answers, y is hidden and out of the tab order.
      expect(area.xInputProps.value.tabindex).toBeUndefined();
      expect(area.xInputProps.value["aria-hidden"]).toBeUndefined();
      expect(area.yInputProps.value.tabindex).toBe(-1);
      expect(area.yInputProps.value["aria-hidden"]).toBe("true");

      unmount();
    });

    it("swaps which one is reachable when the other takes focus", () => {
      const { area, unmount } = setup();

      area.yInputHandlers.onFocus();

      expect(area.yInputProps.value.tabindex).toBeUndefined();
      expect(area.yInputProps.value["aria-hidden"]).toBeUndefined();
      expect(area.xInputProps.value.tabindex).toBe(-1);
      expect(area.xInputProps.value["aria-hidden"]).toBe("true");

      unmount();
    });

    it("reveals both once the keyboard has moved the value", async () => {
      const { area, el, unmount } = setup({ defaultValue: "hsl(30, 100%, 50%)" });

      await key(el("thumb"), "ArrowRight");

      // Still one tab stop, but both are readable now so each channel can be announced.
      expect(area.xInputProps.value["aria-hidden"]).toBeUndefined();
      expect(area.yInputProps.value["aria-hidden"]).toBeUndefined();
      expect(area.yInputProps.value.tabindex).toBe(-1);

      unmount();
    });

    it("submits each channel under its own name", () => {
      const { area, unmount } = setup({ form: "the-form", xName: "hue", yName: "saturation" });

      expect(area.xInputProps.value).toMatchObject({ form: "the-form", name: "hue" });
      expect(area.yInputProps.value).toMatchObject({ form: "the-form", name: "saturation" });

      unmount();
    });

    it("disables both when the area is disabled", () => {
      const { area, unmount } = setup({ isDisabled: true });

      expect(area.xInputProps.value.disabled).toBe(true);
      expect(area.yInputProps.value.disabled).toBe(true);

      unmount();
    });

    it("stays in the accessibility tree while out of sight", () => {
      const { area, unmount } = setup();

      expect(area.inputStyle).toMatchObject({
        height: "100%",
        opacity: 0.0001,
        pointerEvents: "none",
        position: "absolute",
        width: "100%",
      });

      unmount();
    });
  });

  describe("value text", () => {
    it("reads all three channels before the value has been touched", () => {
      const { area, unmount } = setup({ defaultValue: "hsl(30, 100%, 50%)" });

      expect(area.xInputProps.value["aria-valuetext"]).toBe(
        "Hue: 30°, Saturation: 100%, Lightness: 50%, vibrant orange",
      );
      // The other axis comes second whichever input is asked, then the held channel.
      expect(area.yInputProps.value["aria-valuetext"]).toBe(
        "Saturation: 100%, Hue: 30°, Lightness: 50%, vibrant orange",
      );

      unmount();
    });

    it("narrows to the channel that moved once the keyboard has been used", async () => {
      const { area, el, unmount } = setup({ defaultValue: "hsl(30, 100%, 50%)" });

      await key(el("thumb"), "ArrowRight");

      expect(area.xInputProps.value["aria-valuetext"]).toBe("Hue: 31°, vibrant orange");

      unmount();
    });

    it("goes back to all three channels when focus leaves", async () => {
      const { area, el, unmount } = setup({ defaultValue: "hsl(30, 100%, 50%)" });

      await key(el("thumb"), "ArrowRight");
      el("thumb").dispatchEvent(new FocusEvent("focusout", { bubbles: true }));
      await nextTick();

      expect(area.xInputProps.value["aria-valuetext"]).toBe(
        "Hue: 31°, Saturation: 100%, Lightness: 50%, vibrant orange",
      );

      unmount();
    });

    it("stays narrowed while focus only moves between the two inputs", async () => {
      const { area, el, unmount } = setup({ defaultValue: "hsl(30, 100%, 50%)" });

      await key(el("thumb"), "ArrowRight");
      el("input-x").dispatchEvent(
        new FocusEvent("focusout", { bubbles: true, relatedTarget: el("input-y") }),
      );
      await nextTick();

      expect(area.xInputProps.value["aria-valuetext"]).toBe("Hue: 31°, vibrant orange");

      unmount();
    });
  });

  describe("keyboard", () => {
    it("steps with the arrows, along the axis the arrow points down", async () => {
      const { el, state, unmount } = setup({ defaultValue: "hsl(30, 50%, 50%)" });
      const thumb = el("thumb");

      await key(thumb, "ArrowRight");
      expect(state.xValue.value).toBe(31);

      await key(thumb, "ArrowLeft");
      expect(state.xValue.value).toBe(30);

      await key(thumb, "ArrowUp");
      expect(state.yValue.value).toBe(51);

      await key(thumb, "ArrowDown");
      expect(state.yValue.value).toBe(50);

      unmount();
    });

    it("pages with shift, by each channel's own page size", async () => {
      const { el, state, unmount } = setup({ defaultValue: "hsl(30, 50%, 50%)" });
      const thumb = el("thumb");

      await key(thumb, "ArrowRight", { shiftKey: true });
      expect(state.xValue.value).toBe(45);

      await key(thumb, "ArrowUp", { shiftKey: true });
      expect(state.yValue.value).toBe(60);

      unmount();
    });

    it("pages along x with Home and End rather than jumping to the ends", async () => {
      // This is where a colour area parts company with a slider: Home and End are *pages*, not
      // jumps, and they run along the horizontal axis.
      const { el, state, unmount } = setup({ defaultValue: "hsl(30, 50%, 50%)" });
      const thumb = el("thumb");

      await key(thumb, "End");
      expect(state.xValue.value).toBe(45);

      await key(thumb, "Home");
      expect(state.xValue.value).toBe(30);

      unmount();
    });

    it("pages along y with PageUp and PageDown", async () => {
      const { el, state, unmount } = setup({ defaultValue: "hsl(30, 50%, 50%)" });
      const thumb = el("thumb");

      await key(thumb, "PageUp");
      expect(state.yValue.value).toBe(60);

      await key(thumb, "PageDown");
      expect(state.yValue.value).toBe(50);

      unmount();
    });

    it("turns the horizontal keys around in a right-to-left locale", async () => {
      const { el, state, unmount } = setup({ defaultValue: "hsl(30, 50%, 50%)", locale: "he-IL" });
      const thumb = el("thumb");

      // Right on the screen is towards the start of the value in a mirrored area.
      await key(thumb, "ArrowRight");
      expect(state.xValue.value).toBe(29);

      await key(thumb, "End");
      expect(state.xValue.value).toBe(14);

      unmount();
    });

    it("reports the end of the interaction for each keystroke", async () => {
      const onChangeEnd = vi.fn();
      const { el, unmount } = setup({ defaultValue: "hsl(30, 50%, 50%)", onChangeEnd });

      await key(el("thumb"), "PageUp");

      expect(onChangeEnd).toHaveBeenCalledTimes(1);

      unmount();
    });

    it("stays put while disabled", async () => {
      const { el, state, unmount } = setup({ defaultValue: "hsl(30, 50%, 50%)", isDisabled: true });

      await key(el("thumb"), "ArrowRight");

      expect(state.xValue.value).toBe(30);

      unmount();
    });
  });

  describe("changes through an input", () => {
    it("routes each input to its own channel", () => {
      const { area, el, state, unmount } = setup({ defaultValue: "hsl(30, 50%, 50%)" });
      const inputX = el("input-x") as HTMLInputElement;
      const inputY = el("input-y") as HTMLInputElement;

      inputX.value = "90";
      area.xInputHandlers.onChange({ target: inputX } as unknown as Event);
      expect(state.xValue.value).toBe(90);

      inputY.value = "20";
      area.yInputHandlers.onChange({ target: inputY } as unknown as Event);
      expect(state.yValue.value).toBe(20);

      unmount();
    });

    it("narrows the value text, the same way the keyboard does", () => {
      const { area, el, unmount } = setup({ defaultValue: "hsl(30, 50%, 50%)" });
      const inputX = el("input-x") as HTMLInputElement;

      inputX.value = "90";
      area.xInputHandlers.onChange({ target: inputX } as unknown as Event);

      expect(area.xInputProps.value["aria-valuetext"]).toBe("Hue: 90°, light vibrant yellow green");

      unmount();
    });
  });
});
