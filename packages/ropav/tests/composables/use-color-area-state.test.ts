import type {UseColorAreaStateOptions} from "@/composables/use-color-area-state";
import type {Color} from "@/utils/color-types";

import {describe, expect, it, vi} from "vitest";
import {effectScope, shallowRef} from "vue";

import {useColorAreaState} from "@/composables/use-color-area-state";
import {parseColor} from "@/utils/color";

/** Run a composable in a disposable scope, mirroring a component lifetime. */
const withScope = <T>(setup: () => T): [T, () => void] => {
  const scope = effectScope();
  const result = scope.run(setup) as T;

  return [result, () => scope.stop()];
};

const setup = (options: UseColorAreaStateOptions = {}) =>
  withScope(() => useColorAreaState(options));

describe("useColorAreaState", () => {
  describe("value", () => {
    it("starts white when given nothing, which puts it in rgb", () => {
      const [state, dispose] = setup();

      // Not the hue × saturation square the name suggests: white is an rgb colour, so the axes
      // are red × green with blue held at its maximum.
      expect(state.value.value.toString("hex")).toBe("#FFFFFF");
      expect(state.channels.value).toEqual({
        xChannel: "red",
        yChannel: "green",
        zChannel: "blue",
      });

      dispose();
    });

    it("parses a string default value", () => {
      const [state, dispose] = setup({defaultValue: "hsl(30, 100%, 50%)"});

      expect(state.value.value.toString("hsl")).toBe("hsl(30, 100%, 50%)");

      dispose();
    });

    it("converts the value into the colour space it was told to work in", () => {
      const [state, dispose] = setup({colorSpace: "hsb", defaultValue: "#ff0000"});

      expect(state.value.value.getColorSpace()).toBe("hsb");
      expect(state.channels.value.xChannel).toBe("hue");

      dispose();
    });

    it("takes the axes it is given, and holds whatever is left over", () => {
      const [state, dispose] = setup({
        defaultValue: "rgb(255, 100, 50)",
        xChannel: "blue",
        yChannel: "green",
      });

      expect(state.channels.value).toEqual({
        xChannel: "blue",
        yChannel: "green",
        zChannel: "red",
      });

      dispose();
    });

    it("replaces the whole colour", () => {
      const onChange = vi.fn();
      const [state, dispose] = setup({defaultValue: "hsl(30, 100%, 50%)", onChange});

      state.setValue("hsl(120, 50%, 25%)");

      expect(state.value.value.toString("hsl")).toBe("hsl(120, 50%, 25%)");
      expect(onChange).toHaveBeenCalledTimes(1);

      dispose();
    });

    it("resets a controlled area to where it came in, and an uncontrolled one to its default", () => {
      const value = shallowRef<Color>(parseColor("hsl(30, 100%, 50%)"));
      const [controlled, disposeControlled] = setup({value: () => value.value});

      value.value = parseColor("hsl(200, 100%, 50%)");

      expect(controlled.value.value.toString("hsl")).toBe("hsl(200, 100%, 50%)");
      // The default a form reset goes back to is where the area started, not where it is now.
      expect(controlled.defaultValue.value.toString("hsl")).toBe("hsl(30, 100%, 50%)");
      disposeControlled();

      const [uncontrolled, disposeUncontrolled] = setup({defaultValue: "hsl(30, 100%, 50%)"});

      uncontrolled.setValue("hsl(200, 100%, 50%)");

      expect(uncontrolled.defaultValue.value.toString("hsl")).toBe("hsl(30, 100%, 50%)");
      disposeUncontrolled();
    });
  });

  describe("channel steps", () => {
    it("reads the step and page size of each axis from its own channel", () => {
      const [hsl, disposeHsl] = setup({defaultValue: "hsl(30, 100%, 50%)"});

      // Hue pages by 15, saturation by 10 — the numbers belong to the channel, not to the area.
      expect(hsl.xChannelStep.value).toBe(1);
      expect(hsl.xChannelPageStep.value).toBe(15);
      expect(hsl.yChannelStep.value).toBe(1);
      expect(hsl.yChannelPageStep.value).toBe(10);
      disposeHsl();

      const [rgb, disposeRgb] = setup({
        defaultValue: "rgb(255, 100, 50)",
        xChannel: "red",
        yChannel: "green",
      });

      expect(rgb.xChannelPageStep.value).toBe(17);
      expect(rgb.yChannelPageStep.value).toBe(17);
      disposeRgb();
    });
  });

  describe("the thumb's position", () => {
    it("measures each axis against its own channel range, counting y from the top", () => {
      const [state, dispose] = setup({defaultValue: "hsl(30, 100%, 50%)"});

      // x = 30/360; y = 1 - 100/100, because a colour area's y axis runs upwards.
      expect(state.getThumbPosition()).toEqual({x: 30 / 360, y: 0});

      dispose();
    });

    it("puts a mid-range value in the middle", () => {
      const [state, dispose] = setup({
        defaultValue: "hsb(30, 80%, 60%)",
        xChannel: "saturation",
        yChannel: "brightness",
      });

      expect(state.getThumbPosition()).toEqual({x: 0.8, y: 1 - 0.6});

      dispose();
    });
  });

  describe("setting a colour from a point", () => {
    it("maps a fraction of the area onto both channels at once", () => {
      const [state, dispose] = setup({defaultValue: "hsl(0, 0%, 50%)"});

      state.setColorFromPoint(0.5, 0.25);

      // x → hue 180 of 360; y → saturation 75, because y is measured from the bottom.
      expect(state.value.value.toString("hsl")).toBe("hsl(180, 75%, 50%)");

      dispose();
    });

    it("clamps a point outside the area to its edge", () => {
      const [state, dispose] = setup({defaultValue: "hsl(30, 50%, 50%)"});

      state.setColorFromPoint(-2, 3);

      expect(state.value.value.toString("hsl")).toBe("hsl(0, 0%, 50%)");

      dispose();
    });

    it("reports one change even though it moves two channels", () => {
      const onChange = vi.fn();
      const [state, dispose] = setup({defaultValue: "hsl(0, 0%, 50%)", onChange});

      state.setColorFromPoint(0.5, 0.5);

      expect(onChange).toHaveBeenCalledTimes(1);

      dispose();
    });

    it("says nothing when the point lands where the colour already is", () => {
      const onChange = vi.fn();
      const [state, dispose] = setup({defaultValue: "hsl(0, 100%, 50%)", onChange});

      state.setColorFromPoint(0, 0);

      expect(onChange).not.toHaveBeenCalled();

      dispose();
    });
  });

  describe("stepping", () => {
    it("steps each axis by whatever it is handed", () => {
      const [state, dispose] = setup({defaultValue: "hsl(30, 50%, 50%)"});

      state.incrementX(15);
      expect(state.xValue.value).toBe(45);

      state.decrementX(15);
      expect(state.xValue.value).toBe(30);

      state.incrementY(10);
      expect(state.yValue.value).toBe(60);

      state.decrementY(10);
      expect(state.yValue.value).toBe(50);

      dispose();
    });

    it("parks on the maximum rather than snapping back below it", () => {
      // Upstream is asymmetric here and this is the asymmetry: stepping *up* past the end lands on
      // the end, while stepping down is a plain snap. A page of 15 from hue 355 would otherwise
      // land back on 345.
      const [state, dispose] = setup({defaultValue: "hsl(355, 100%, 50%)"});

      state.incrementX(15);

      expect(state.xValue.value).toBe(360);

      dispose();
    });

    it("stops at the minimum", () => {
      const [state, dispose] = setup({defaultValue: "hsl(5, 100%, 50%)"});

      state.decrementX(15);

      expect(state.xValue.value).toBe(0);

      dispose();
    });

    it("says nothing when a step cannot move the value", () => {
      const onChange = vi.fn();
      const [state, dispose] = setup({defaultValue: "hsl(360, 100%, 50%)", onChange});

      state.incrementX(15);

      expect(onChange).not.toHaveBeenCalled();

      dispose();
    });
  });

  describe("dragging", () => {
    it("reports the end of an interaction once, on the falling edge", () => {
      const onChangeEnd = vi.fn();
      const [state, dispose] = setup({defaultValue: "hsl(30, 100%, 50%)", onChangeEnd});

      state.setDragging(true);
      state.setXValue(60);
      state.setDragging(false);
      // Both the container's move handler and the pointer release call this; only the first counts.
      state.setDragging(false);

      expect(onChangeEnd).toHaveBeenCalledTimes(1);
      expect((onChangeEnd.mock.calls[0]?.[0] as Color).getChannelValue("hue")).toBe(60);

      dispose();
    });

    it("exposes whether it is being dragged", () => {
      const [state, dispose] = setup();

      expect(state.isDragging.value).toBe(false);

      state.setDragging(true);

      expect(state.isDragging.value).toBe(true);

      dispose();
    });
  });

  describe("the colour the thumb shows", () => {
    it("paints the value opaque", () => {
      const [state, dispose] = setup({defaultValue: "hsla(30, 100%, 50%, 0.3)"});

      expect(state.getDisplayColor().toString("css")).toBe("hsla(30, 100%, 50%, 1)");

      dispose();
    });
  });
});
