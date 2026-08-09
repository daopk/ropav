import type {ColorSliderState} from "@/composables";
import type {Color} from "@/utils/color-types";

import {renderVapor} from "@heroui/testing/helpers/vue";
import {describe, expect, it, vi} from "vitest";
import {nextTick, reactive} from "vue";

import {parseColor} from "@/utils/color";

import Host from "../fixtures/color-slider-state-host.vue";

/**
 * Mount the host and hand back the live state.
 *
 * `props` is passed by reference: `renderVapor` reads each key through a getter, so a `reactive`
 * object handed in here keeps driving the composable.
 */
const setup = (props: Record<string, unknown> = {}) => {
  let state!: ColorSliderState;

  Object.assign(props, {
    defaultValue: "defaultValue" in props ? props["defaultValue"] : "hsl(0, 100%, 50%)",
    onReady: (value: ColorSliderState) => (state = value),
  });

  const rendered = renderVapor(Host, {props});

  return {...rendered, state};
};

describe("useColorSliderState", () => {
  describe("value", () => {
    it("refuses to run without a colour to work from", () => {
      expect(() => setup({defaultValue: undefined})).toThrow(
        "useColorSliderState requires a value or defaultValue",
      );
    });

    it("parses a string default value", () => {
      const {state, unmount} = setup();

      expect(state.value.value.toString("hsl")).toBe("hsl(0, 100%, 50%)");
      expect(state.getThumbValue(0)).toBe(0);

      unmount();
    });

    it("takes a parsed colour as well as a string", () => {
      const {state, unmount} = setup({defaultValue: parseColor("hsl(200, 100%, 50%)")});

      expect(state.getThumbValue(0)).toBe(200);

      unmount();
    });

    it("converts the value into the colour space it was told to work in", () => {
      const {state, unmount} = setup({colorSpace: "hsl", defaultValue: "#ff0000"});

      expect(state.value.value.getColorSpace()).toBe("hsl");
      expect(state.value.value.toString("hsl")).toBe("hsl(0, 100%, 50%)");

      unmount();
    });

    it("replaces the whole colour", () => {
      const onChange = vi.fn();
      const {state, unmount} = setup({onChange});

      state.setValue("hsl(120, 50%, 25%)");

      expect(state.value.value.toString("hsl")).toBe("hsl(120, 50%, 25%)");
      expect(onChange).toHaveBeenCalledTimes(1);

      unmount();
    });

    it("follows a controlled value without holding one of its own", async () => {
      const onChange = vi.fn();
      const props = reactive({
        defaultValue: undefined,
        onChange,
        value: parseColor("hsl(0, 100%, 50%)") as Color,
      });
      const {state, unmount} = setup(props);

      state.setThumbValue(0, 90);

      // The owner of `value` decides; the state has not moved on its own.
      expect(state.getThumbValue(0)).toBe(0);
      expect(onChange).toHaveBeenCalledTimes(1);

      props.value = parseColor("hsl(90, 100%, 50%)");
      await nextTick();

      expect(state.getThumbValue(0)).toBe(90);

      unmount();
    });
  });

  describe("channel range", () => {
    it("takes its bounds and step from the channel", () => {
      const hue = setup();

      expect([
        hue.state.getThumbMinValue(0),
        hue.state.getThumbMaxValue(0),
        hue.state.step.value,
      ]).toEqual([0, 360, 1]);
      hue.unmount();

      const alpha = setup({channel: "alpha", defaultValue: "hsla(0, 100%, 50%, 0.5)"});

      expect([
        alpha.state.getThumbMinValue(0),
        alpha.state.getThumbMaxValue(0),
        alpha.state.step.value,
      ]).toEqual([0, 1, 0.01]);
      alpha.unmount();

      const red = setup({channel: "red", defaultValue: "rgb(255, 0, 0)"});

      expect([
        red.state.getThumbMinValue(0),
        red.state.getThumbMaxValue(0),
        red.state.step.value,
      ]).toEqual([0, 255, 1]);
      red.unmount();
    });

    it("pages by the channel's own step rather than a tenth of the range", () => {
      // The underlying slider state would say 36 for hue and 25 for red; a colour channel carries
      // a page size of its own, and these are the numbers that reach the keyboard.
      const hue = setup();

      expect(hue.state.pageSize.value).toBe(15);
      hue.unmount();

      const red = setup({channel: "red", defaultValue: "rgb(255, 0, 0)"});

      expect(red.state.pageSize.value).toBe(17);
      red.unmount();

      const saturation = setup({channel: "saturation"});

      expect(saturation.state.pageSize.value).toBe(10);
      saturation.unmount();

      const alpha = setup({channel: "alpha", defaultValue: "hsla(0, 100%, 50%, 0.5)"});

      expect(alpha.state.pageSize.value).toBe(0.1);
      alpha.unmount();
    });
  });

  describe("labels", () => {
    it("reads the value as a colour channel, not as a bare number", () => {
      const hue = setup({defaultValue: "hsl(200, 100%, 50%)"});

      expect(hue.state.getThumbValueLabel(0)).toBe("200°");
      expect(hue.state.getFormattedValue()).toBe("200°");
      hue.unmount();

      const saturation = setup({channel: "saturation", defaultValue: "hsl(0, 50%, 50%)"});

      expect(saturation.state.getThumbValueLabel(0)).toBe("50%");
      saturation.unmount();

      const red = setup({channel: "red", defaultValue: "rgb(255, 0, 0)"});

      expect(red.state.getThumbValueLabel(0)).toBe("255");
      red.unmount();
    });
  });

  describe("display colour", () => {
    it("paints a hue slider fully saturated whatever the value holds", () => {
      const {state, unmount} = setup({defaultValue: "hsl(200, 20%, 20%)"});

      expect(state.getDisplayColor().toString("css")).toBe("hsla(200, 100%, 50%, 1)");

      unmount();
    });

    it("paints every channel but alpha opaque", () => {
      const saturation = setup({channel: "saturation", defaultValue: "hsla(0, 100%, 50%, 0.5)"});

      expect(saturation.state.getDisplayColor().toString("css")).toBe("hsla(0, 100%, 50%, 1)");
      saturation.unmount();

      const lightness = setup({channel: "lightness", defaultValue: "hsla(0, 100%, 50%, 0.5)"});

      expect(lightness.state.getDisplayColor().toString("css")).toBe("hsla(0, 100%, 50%, 1)");
      lightness.unmount();

      const red = setup({channel: "red", defaultValue: "rgba(255, 0, 0, 0.5)"});

      expect(red.state.getDisplayColor().toString("css")).toBe("rgba(255, 0, 0, 1)");
      red.unmount();
    });

    it("paints an alpha slider with the value itself", () => {
      const {state, unmount} = setup({channel: "alpha", defaultValue: "hsla(0, 100%, 50%, 0.5)"});

      expect(state.getDisplayColor().toString("css")).toBe("hsla(0, 100%, 50%, 0.5)");

      unmount();
    });
  });

  describe("changes", () => {
    it("turns a thumb move back into a colour", () => {
      const onChange = vi.fn();
      const {state, unmount} = setup({onChange});

      state.setThumbValue(0, 120);

      expect(state.getThumbValue(0)).toBe(120);
      expect(onChange).toHaveBeenCalledTimes(1);
      expect((onChange.mock.calls[0]?.[0] as Color).getChannelValue("hue")).toBe(120);

      unmount();
    });

    it("keeps every other channel where it was", () => {
      const {state, unmount} = setup({defaultValue: "hsl(0, 40%, 60%)"});

      state.setThumbValue(0, 120);

      expect(state.value.value.toString("hsl")).toBe("hsl(120, 40%, 60%)");

      unmount();
    });

    it("reports the end of an interaction once", () => {
      const onChangeEnd = vi.fn();
      const {state, unmount} = setup({onChangeEnd});

      state.setThumbDragging(0, true);
      state.setThumbValue(0, 90);
      state.setThumbValue(0, 120);
      state.setThumbDragging(0, false);

      expect(onChangeEnd).toHaveBeenCalledTimes(1);
      expect((onChangeEnd.mock.calls[0]?.[0] as Color).getChannelValue("hue")).toBe(120);

      unmount();
    });

    it("exposes whether the single thumb is being dragged", () => {
      const {state, unmount} = setup();

      expect(state.isDragging.value).toBe(false);

      state.setThumbDragging(0, true);

      expect(state.isDragging.value).toBe(true);

      state.setThumbDragging(0, false);

      expect(state.isDragging.value).toBe(false);

      unmount();
    });

    it("does not move while disabled", () => {
      const onChange = vi.fn();
      const {state, unmount} = setup({isDisabled: true, onChange});

      state.setThumbValue(0, 120);

      expect(state.getThumbValue(0)).toBe(0);
      expect(onChange).not.toHaveBeenCalled();

      unmount();
    });
  });
});
