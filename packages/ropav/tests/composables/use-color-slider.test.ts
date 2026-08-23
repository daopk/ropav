import type {ColorSliderHarnessProps} from "../fixtures/color-slider.types";
import type {ColorSliderState, UseColorSliderReturn} from "@/composables";

import {renderVapor} from "@heroui/testing/helpers/vue";
import {describe, expect, it} from "vitest";

import Harness from "../fixtures/color-slider-harness.vue";

const setup = (props: Partial<ColorSliderHarnessProps> = {}) => {
  let slider!: UseColorSliderReturn;
  let state!: ColorSliderState;

  const rendered = renderVapor(Harness, {
    props: {
      defaultValue: "hsl(0, 100%, 50%)",
      ...props,
      onReady: (ready) => {
        slider = ready.slider;
        state = ready.state;
      },
    } satisfies ColorSliderHarnessProps,
  });

  return {...rendered, slider, state};
};

describe("useColorSlider", () => {
  describe("labelling", () => {
    it("names an otherwise unnamed slider after its channel", () => {
      const hue = setup();

      expect(hue.slider.trackAttrs.value["aria-label"]).toBe("Hue");
      hue.unmount();

      const red = setup({channel: "red", defaultValue: "rgb(255, 0, 0)"});

      expect(red.slider.trackAttrs.value["aria-label"]).toBe("Red");
      red.unmount();
    });

    it("keeps out of the way of a label that already exists", () => {
      const labelled = setup({labelId: "the-label"});

      expect(labelled.slider.trackAttrs.value["aria-label"]).toBeUndefined();
      expect(labelled.slider.trackAttrs.value["aria-labelledby"]).toBe("the-label");
      labelled.unmount();

      const referenced = setup({ariaLabelledby: "elsewhere"});

      expect(referenced.slider.trackAttrs.value["aria-label"]).toBeUndefined();
      referenced.unmount();
    });

    it("prefers the caller's own label over the channel name", () => {
      const {slider, unmount} = setup({ariaLabel: "Pick a hue"});

      expect(slider.trackAttrs.value["aria-label"]).toBe("Pick a hue");

      unmount();
    });

    it("puts the group on the track, where the stylesheet and the label expect it", () => {
      const {slider, unmount} = setup({id: "hue-slider"});

      expect(slider.trackAttrs.value.role).toBe("group");
      expect(slider.trackAttrs.value.id).toBe("hue-slider");
      // The thumb is named by the group when nothing else names it.
      expect(slider.inputProps.value["aria-labelledby"]).toBe("hue-slider");
      expect(slider.inputProps.value.id).toBe("hue-slider-0");

      unmount();
    });

    it("leaves the empty description idrefs React Aria emits unset", () => {
      const {slider, unmount} = setup();

      expect(slider.inputProps.value["aria-describedby"]).toBeUndefined();

      unmount();
    });
  });

  describe("value text", () => {
    it("names the hue after the degrees", () => {
      const {slider, unmount} = setup({defaultValue: "hsl(200, 100%, 50%)"});

      expect(slider.inputProps.value["aria-valuetext"]).toBe("200°, cyan blue");

      unmount();
    });

    it("names the colour after every other channel", () => {
      const saturation = setup({channel: "saturation"});

      expect(saturation.slider.inputProps.value["aria-valuetext"]).toBe("100%, vibrant red");
      saturation.unmount();

      const red = setup({channel: "red", defaultValue: "rgb(255, 0, 0)"});

      expect(red.slider.inputProps.value["aria-valuetext"]).toBe("255, vibrant red");
      red.unmount();
    });

    it("says nothing about the colour on an alpha slider", () => {
      const {slider, unmount} = setup({
        channel: "alpha",
        defaultValue: "hsla(0, 100%, 50%, 0.5)",
      });

      expect(slider.inputProps.value["aria-valuetext"]).toBe("50%");

      unmount();
    });

    it("follows the value", () => {
      const {slider, state, unmount} = setup();

      state.setThumbValue(0, 200);

      expect(slider.inputProps.value["aria-valuetext"]).toBe("200°, cyan blue");

      unmount();
    });
  });

  describe("gradient", () => {
    it("draws hue as the whole wheel, in seven stops", () => {
      const {slider, unmount} = setup();

      expect(slider.trackStyle.value.background).toBe(
        "linear-gradient(to right, hsla(0, 100%, 50%, 1), hsla(60, 100%, 50%, 1), " +
          "hsla(120, 100%, 50%, 1), hsla(180, 100%, 50%, 1), hsla(240, 100%, 50%, 1), " +
          "hsla(300, 100%, 50%, 1), hsla(360, 100%, 50%, 1))",
      );

      unmount();
    });

    it("draws lightness with a stop in the middle, or the hue would never show", () => {
      const {slider, unmount} = setup({channel: "lightness"});

      expect(slider.trackStyle.value.background).toBe(
        "linear-gradient(to right, hsla(0, 100%, 0%, 1), hsla(0, 100%, 50%, 1), " +
          "hsla(0, 100%, 100%, 1))",
      );

      unmount();
    });

    it("draws every other channel between its two ends", () => {
      const saturation = setup({channel: "saturation"});

      expect(saturation.slider.trackStyle.value.background).toBe(
        "linear-gradient(to right, hsla(0, 0%, 50%, 1), hsla(0, 100%, 50%, 1))",
      );
      saturation.unmount();

      const red = setup({channel: "red", defaultValue: "rgb(255, 0, 0)"});

      expect(red.slider.trackStyle.value.background).toBe(
        "linear-gradient(to right, rgba(0, 0, 0, 1), rgba(255, 0, 0, 1))",
      );
      red.unmount();

      const alpha = setup({channel: "alpha", defaultValue: "hsla(0, 100%, 50%, 0.5)"});

      expect(alpha.slider.trackStyle.value.background).toBe(
        "linear-gradient(to right, hsla(0, 100%, 50%, 0), hsla(0, 100%, 50%, 1))",
      );
      alpha.unmount();
    });

    it("runs up a vertical track and along the reading direction of a horizontal one", () => {
      const vertical = setup({orientation: "vertical"});

      expect(vertical.slider.trackStyle.value.background).toContain("linear-gradient(to top,");
      vertical.unmount();

      const rtl = setup({locale: "he-IL"});

      expect(rtl.slider.trackStyle.value.background).toContain("linear-gradient(to left,");
      rtl.unmount();

      // Reading direction only matters along the track, so a vertical slider ignores it.
      const rtlVertical = setup({locale: "he-IL", orientation: "vertical"});

      expect(rtlVertical.slider.trackStyle.value.background).toContain("linear-gradient(to top,");
      rtlVertical.unmount();
    });

    it("follows the value", () => {
      const {slider, state, unmount} = setup({channel: "saturation"});

      state.setThumbValue(0, 0);

      expect(slider.trackStyle.value.background).toBe(
        "linear-gradient(to right, hsla(0, 0%, 50%, 1), hsla(0, 100%, 50%, 1))",
      );

      state.setValue("hsl(120, 100%, 50%)");

      expect(slider.trackStyle.value.background).toBe(
        "linear-gradient(to right, hsla(120, 0%, 50%, 1), hsla(120, 100%, 50%, 1))",
      );

      unmount();
    });
  });

  describe("styles", () => {
    it("keeps the track's own layout under the gradient", () => {
      const {slider, unmount} = setup();

      expect(slider.trackStyle.value).toMatchObject({
        forcedColorAdjust: "none",
        position: "relative",
        touchAction: "none",
      });

      unmount();
    });

    it("paints the thumb with the colour and positions it along one axis only", () => {
      const horizontal = setup({defaultValue: "hsl(200, 100%, 50%)"});

      expect(horizontal.slider.thumbStyle.value).toMatchObject({
        backgroundColor: "hsla(200, 100%, 50%, 1)",
        forcedColorAdjust: "none",
        left: "55.55555555555556%",
        position: "absolute",
      });
      // The stylesheet centres the other axis; writing both here would fight it.
      expect(horizontal.slider.thumbStyle.value.top).toBeUndefined();
      horizontal.unmount();

      const vertical = setup({defaultValue: "hsl(200, 100%, 50%)", orientation: "vertical"});

      expect(vertical.slider.thumbStyle.value.top).toBe("44.44444444444444%");
      expect(vertical.slider.thumbStyle.value.left).toBeUndefined();
      vertical.unmount();
    });

    it("hides the input without taking it out of the tab order", () => {
      const {slider, unmount} = setup();

      expect(slider.inputStyle).toMatchObject({
        height: "100%",
        opacity: 0.0001,
        pointerEvents: "none",
        position: "absolute",
        width: "100%",
      });

      unmount();
    });
  });

  describe("the hidden input", () => {
    it("carries the channel's range rather than the slider's own", () => {
      const {slider, unmount} = setup();

      expect(slider.inputProps.value).toMatchObject({
        max: 360,
        min: 0,
        step: 1,
        tabindex: 0,
        type: "range",
        value: 0,
      });

      unmount();
    });

    it("submits under the name it was given", () => {
      const {slider, unmount} = setup({form: "the-form", name: "hue"});

      expect(slider.inputProps.value).toMatchObject({form: "the-form", name: "hue"});

      unmount();
    });

    it("drops out of the tab order while disabled", () => {
      const {slider, unmount} = setup({isDisabled: true});

      expect(slider.inputProps.value.disabled).toBe(true);
      expect(slider.inputProps.value.tabindex).toBeUndefined();
      expect(slider.isDisabled.value).toBe(true);

      unmount();
    });
  });
});
