import type {ColorChannelFieldState} from "@/composables/use-color-channel-field-state";

import {renderVapor} from "@heroui/testing/helpers/vue";
import {describe, expect, it, vi} from "vitest";
import {nextTick, reactive} from "vue";

import Host from "../fixtures/color-channel-field-state-host.vue";

/**
 * Mount the host and hand back the live state.
 *
 * `props` is passed by reference: `renderVapor` reads each key through a getter, so a `reactive`
 * object handed in here keeps driving the composable.
 */
const mount = (props: Record<string, unknown> = {}) => {
  let state!: ColorChannelFieldState;

  Object.assign(props, {onReady: (next: ColorChannelFieldState) => (state = next)});

  const result = renderVapor(Host, {props});

  return {...result, state: () => state};
};

describe("useColorChannelFieldState", () => {
  describe("the number it shows", () => {
    it("reads one channel of the colour", () => {
      const {state, unmount} = mount({channel: "red", defaultValue: "#3B82F6"});

      expect(state().numberValue.value).toBe(0x3b);
      expect(state().inputValue.value).toBe("59");

      unmount();
    });

    it("converts into the colour space the field works in", () => {
      // The value arrives as hex; the field edits hue, which only exists in hsl.
      const {state, unmount} = mount({
        channel: "hue",
        colorSpace: "hsl",
        defaultValue: "#7F007F",
      });

      expect(state().inputValue.value).toBe("300°");

      unmount();
    });

    it("writes a percent channel as a percent", () => {
      const {state, unmount} = mount({
        channel: "saturation",
        colorSpace: "hsl",
        defaultValue: "#7F007F",
      });

      expect(state().inputValue.value).toBe("100%");

      unmount();
    });

    it("shows nothing when there is no colour", () => {
      const {state, unmount} = mount({channel: "red", value: null});

      expect(state().inputValue.value).toBe("");
      expect(Number.isNaN(state().numberValue.value)).toBe(true);

      unmount();
    });

    it("still reports a channel range with no colour to read it from", () => {
      // Black stands in: it is the colour whose every channel sits at its minimum, so an empty
      // field still knows how far its number may go.
      const {state, unmount} = mount({channel: "red", value: null});

      expect(state().minValue.value).toBe(0);
      expect(state().maxValue.value).toBe(255);

      unmount();
    });
  });

  describe("the percent multiplier", () => {
    it("edits a 0-100 percent channel as 0-1 so Intl can scale it back", () => {
      // Without this a saturation of 100 would be formatted as 10,000%.
      const {state, unmount} = mount({
        channel: "saturation",
        colorSpace: "hsl",
        defaultValue: "#7F007F",
      });

      expect(state().numberValue.value).toBe(1);
      expect(state().minValue.value).toBe(0);
      expect(state().maxValue.value).toBe(1);
      expect(state().inputValue.value).toBe("100%");

      unmount();
    });

    it("leaves alpha alone, which already runs 0-1", () => {
      const {state, unmount} = mount({channel: "alpha", defaultValue: "#3B82F680"});

      // Parsed back out of the text rather than read off the colour, which is what the number
      // field means by its value: `50%` parses to exactly 0.5, not to the 0.50196 that `#80`
      // really is. React does the same, and it is what a form submits.
      expect(state().numberValue.value).toBe(0.5);
      expect(state().maxValue.value).toBe(1);
      expect(state().inputValue.value).toBe("50%");

      unmount();
    });

    it("scales an edit back up into the colour", () => {
      const onChange = vi.fn();
      const {state, unmount} = mount({
        channel: "saturation",
        colorSpace: "hsl",
        defaultValue: "#7F007F",
        onChange,
      });

      state().setNumberValue(0.5);

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange.mock.calls[0]![0].getChannelValue("saturation")).toBe(50);

      unmount();
    });
  });

  describe("editing", () => {
    it("turns a number back into a colour", () => {
      const onChange = vi.fn();
      const {state, unmount} = mount({channel: "red", defaultValue: "#3B82F6", onChange});

      state().setNumberValue(255);

      expect(onChange.mock.calls[0]![0].toString("hex")).toBe("#FF82F6");

      unmount();
    });

    it("clears the colour when the number is cleared", () => {
      const onChange = vi.fn();
      const {state, unmount} = mount({channel: "red", defaultValue: "#3B82F6", onChange});

      state().commit("");

      expect(onChange).toHaveBeenCalledWith(null);

      unmount();
    });

    it("steps by the channel's own step", () => {
      const onChange = vi.fn();
      const {state, unmount} = mount({channel: "red", defaultValue: "#3B82F6", onChange});

      state().increment();

      expect(onChange.mock.calls[0]![0].getChannelValue("red")).toBe(60);

      unmount();
    });

    it("stops at the end of the channel's range", () => {
      const {state, unmount} = mount({channel: "red", defaultValue: "#FF82F6"});

      state().increment();

      expect(state().colorValue.value.getChannelValue("red")).toBe(255);

      unmount();
    });
  });

  describe("a controlled field", () => {
    it("never holds a number of its own", () => {
      // The state is permanently controlled by the colour: nothing is stored but the colour, so a
      // declined edit leaves the number exactly where it was.
      const onChange = vi.fn();
      const props = reactive({channel: "red", onChange, value: "#3B82F6"});
      const {state, unmount} = mount(props);

      state().setNumberValue(255);

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(state().numberValue.value).toBe(0x3b);

      unmount();
    });

    it("follows the owner's colour", async () => {
      const props = reactive({channel: "red", value: "#3B82F6"});
      const {state, unmount} = mount(props);

      props.value = "#FF82F6";
      await nextTick();

      expect(state().inputValue.value).toBe("255");

      unmount();
    });
  });

  describe("what a form reset goes back to", () => {
    it("reports the default colour in the field's own space", () => {
      const {state, unmount} = mount({
        channel: "hue",
        colorSpace: "hsl",
        defaultValue: "#7F007F",
      });

      state().setColorValue(null);

      expect(state().defaultColorValue.value?.toString("hex")).toBe("#7F007F");
      expect(state().defaultNumberValue.value).toBe(300);

      unmount();
    });

    it("reports nothing for a field that started empty", () => {
      const {state, unmount} = mount({channel: "red", value: null});

      expect(state().defaultColorValue.value).toBeNull();
      expect(Number.isNaN(state().defaultNumberValue.value)).toBe(true);

      unmount();
    });
  });
});
