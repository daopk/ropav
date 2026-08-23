import type { ColorFieldState } from "@/composables/use-color-field-state";
import type { Color } from "@/utils/color-types";

import { renderVapor } from "@ropav/testing/helpers/vue";
import { describe, expect, it, vi } from "vitest";
import { nextTick, reactive } from "vue";

import { parseColor } from "@/utils/color";

import Host from "../fixtures/color-field-state-host.vue";

/**
 * Mount the host and hand back the live state.
 *
 * `props` is passed by reference: `renderVapor` reads each key through a getter, so a `reactive`
 * object handed in here keeps driving the composable.
 */
const mount = (props: Record<string, unknown> = {}) => {
  let state!: ColorFieldState;

  Object.assign(props, { onReady: (next: ColorFieldState) => (state = next) });

  const result = renderVapor(Host, { props });

  return { ...result, state: () => state };
};

describe("useColorFieldState", () => {
  describe("the value it starts with", () => {
    it("writes the default colour into the input", () => {
      const { state, unmount } = mount({ defaultValue: "#0485F7" });

      expect(state().inputValue.value).toBe("#0485F7");
      expect(state().colorValue.value?.toString("hex")).toBe("#0485F7");

      unmount();
    });

    it("normalises a short hex on the way in", () => {
      const { state, unmount } = mount({ defaultValue: "#abc" });

      expect(state().inputValue.value).toBe("#AABBCC");

      unmount();
    });

    it("starts empty when the caller supplied nothing", () => {
      // Not black: `null` means the field has no colour, and writing `#000000` would put a value
      // in front of the user that nobody chose.
      const { state, unmount } = mount();

      expect(state().inputValue.value).toBe("");
      expect(state().colorValue.value).toBeNull();

      unmount();
    });

    it("starts empty on a controlled null", () => {
      const { state, unmount } = mount({ value: null });

      expect(state().inputValue.value).toBe("");

      unmount();
    });

    it("treats an unparseable string as no colour at all", () => {
      const { state, unmount } = mount({ defaultValue: "not-a-color" });

      expect(state().colorValue.value).toBeNull();
      expect(state().inputValue.value).toBe("");

      unmount();
    });
  });

  describe("what may be typed", () => {
    it("accepts a half-typed hex", () => {
      // Validation runs on commit, not on every keystroke — otherwise `#ff` on the way to
      // `#ffcc00` would be refused.
      const { state, unmount } = mount();

      expect(state().validate("")).toBe(true);
      expect(state().validate("#")).toBe(true);
      expect(state().validate("f")).toBe(true);
      expect(state().validate("ff")).toBe(true);
      expect(state().validate("#ffcc00")).toBe(true);
      expect(state().validate("ffcc00")).toBe(true);

      unmount();
    });

    it("refuses a seventh digit and anything that is not one", () => {
      const { state, unmount } = mount();

      expect(state().validate("#ffcc001")).toBe(false);
      expect(state().validate("zz")).toBe(false);
      expect(state().validate("#gg")).toBe(false);
      expect(state().validate("##ff")).toBe(false);

      unmount();
    });

    it("keeps the colour still while the text is being typed", () => {
      const { state, unmount } = mount({ defaultValue: "#0485F7" });

      state().setInputValue("#ff");

      expect(state().inputValue.value).toBe("#ff");
      expect(state().colorValue.value?.toString("hex")).toBe("#0485F7");

      unmount();
    });
  });

  describe("committing", () => {
    it("parses the text and writes it back out in full", () => {
      const { state, unmount } = mount({ defaultValue: "#0485F7" });

      state().setInputValue("abc");
      state().commit();

      expect(state().colorValue.value?.toString("hex")).toBe("#AABBCC");
      expect(state().inputValue.value).toBe("#AABBCC");

      unmount();
    });

    it("accepts text with no leading hash", () => {
      const { state, unmount } = mount();

      state().setInputValue("ffcc00");
      state().commit();

      expect(state().colorValue.value?.toString("hex")).toBe("#FFCC00");

      unmount();
    });

    it("puts the current colour back when the text cannot be parsed", () => {
      // Recoverable rather than destructive: a half-typed entry does not throw the colour away.
      const { state, unmount } = mount({ defaultValue: "#0485F7" });

      state().setInputValue("#ff");
      state().commit();

      expect(state().colorValue.value?.toString("hex")).toBe("#0485F7");
      expect(state().inputValue.value).toBe("#0485F7");

      unmount();
    });

    it("clears the colour when the text is emptied", () => {
      const { state, unmount } = mount({ defaultValue: "#0485F7" });

      state().setInputValue("");
      state().commit();

      expect(state().colorValue.value).toBeNull();
      expect(state().inputValue.value).toBe("");

      unmount();
    });

    it("normalises the text even when the colour did not move", () => {
      const { state, unmount } = mount({ defaultValue: "#0485F7" });

      state().setInputValue("0485f7");
      state().commit();

      expect(state().inputValue.value).toBe("#0485F7");

      unmount();
    });

    it("reports a committed colour to its owner", () => {
      const onChange = vi.fn();
      const { state, unmount } = mount({ defaultValue: "#0485F7", onChange });

      state().setInputValue("#000000");
      state().commit();

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange.mock.calls[0]![0].toString("hex")).toBe("#000000");

      unmount();
    });

    it("says nothing when the committed colour is the one already held", () => {
      // Every `Color` method returns a new instance, so comparing by identity would report a
      // change on every keystroke that reparsed the same text.
      const onChange = vi.fn();
      const { state, unmount } = mount({ defaultValue: "#0485F7", onChange });

      state().setInputValue("0485f7");
      state().commit();

      expect(onChange).not.toHaveBeenCalled();

      unmount();
    });
  });

  describe("stepping", () => {
    it("steps the whole hex as one integer", () => {
      // A hex field is not three channels: incrementing `#0000FF` gives `#000100`.
      const { state, unmount } = mount({ defaultValue: "#0000FF" });

      state().increment();

      expect(state().colorValue.value?.toString("hex")).toBe("#000100");

      unmount();
    });

    it("steps down", () => {
      const { state, unmount } = mount({ defaultValue: "#000100" });

      state().decrement();

      expect(state().colorValue.value?.toString("hex")).toBe("#0000FF");

      unmount();
    });

    it("stops at white and at black", () => {
      const { state: high, unmount: unmountHigh } = mount({ defaultValue: "#FFFFFF" });

      high().increment();

      expect(high().colorValue.value?.toString("hex")).toBe("#FFFFFF");

      unmountHigh();

      const { state: low, unmount: unmountLow } = mount({ defaultValue: "#000000" });

      low().decrement();

      expect(low().colorValue.value?.toString("hex")).toBe("#000000");

      unmountLow();
    });

    it("steps from black when the field is empty", () => {
      const { state, unmount } = mount();

      state().increment();

      expect(state().colorValue.value?.toString("hex")).toBe("#000001");

      unmount();
    });

    it("steps from the text rather than from the colour", () => {
      // The text is what the user is looking at, so stepping has to start there — otherwise
      // typing a value and pressing the up arrow would step the old colour.
      const { state, unmount } = mount({ defaultValue: "#0485F7" });

      state().setInputValue("#000000");
      state().increment();

      expect(state().colorValue.value?.toString("hex")).toBe("#000001");

      unmount();
    });

    it("jumps to white and to black", () => {
      const { state, unmount } = mount({ defaultValue: "#0485F7" });

      state().incrementToMax();

      expect(state().colorValue.value?.toString("hex")).toBe("#FFFFFF");

      state().decrementToMin();

      expect(state().colorValue.value?.toString("hex")).toBe("#000000");

      unmount();
    });
  });

  describe("a controlled field", () => {
    it("keeps the owner's colour when the owner declines the change", async () => {
      const { state, unmount } = mount({ value: "#0485F7" });

      state().setInputValue("#000000");
      state().commit();
      await nextTick();

      expect(state().colorValue.value?.toString("hex")).toBe("#0485F7");
      expect(state().inputValue.value).toBe("#0485F7");

      unmount();
    });

    it("follows the owner's colour into the text", async () => {
      const props = reactive<{ value: string | null }>({ value: "#0485F7" });
      const { state, unmount } = mount(props);

      props.value = "#FFCC00";
      await nextTick();

      expect(state().inputValue.value).toBe("#FFCC00");

      unmount();
    });

    it("empties the text when the owner clears the colour", async () => {
      const props = reactive<{ value: string | null }>({ value: "#0485F7" });
      const { state, unmount } = mount(props);

      props.value = null;
      await nextTick();

      expect(state().inputValue.value).toBe("");

      unmount();
    });
  });

  describe("what a form reset goes back to", () => {
    it("reports the default colour", () => {
      const { state, unmount } = mount({ defaultValue: "#0485F7" });

      state().setColorValue(parseColor("#000000"));

      expect(state().defaultColorValue.value?.toString("hex")).toBe("#0485F7");

      unmount();
    });

    it("reports where a controlled field started when it has no default", () => {
      const { state, unmount } = mount({ value: "#0485F7" });

      expect(state().defaultColorValue.value?.toString("hex")).toBe("#0485F7");

      unmount();
    });

    it("reports nothing for a field that started empty", () => {
      const { state, unmount } = mount();

      expect(state().defaultColorValue.value).toBeNull();

      unmount();
    });
  });

  describe("validation", () => {
    it("hands the colour to a validate function", () => {
      const validate = vi.fn<(value: Color | null) => string | null>(() => null);
      const { state, unmount } = mount({ defaultValue: "#0485F7", validate });

      // Read first: the verdict is a computed, so nothing runs `validate` until someone asks.
      expect(state().realtimeValidation.value.isInvalid).toBe(false);
      expect(validate).toHaveBeenCalled();
      expect(validate.mock.calls[0]![0]?.toString("hex")).toBe("#0485F7");

      unmount();
    });

    it("reveals a rejection once the field commits", () => {
      const { state, unmount } = mount({
        defaultValue: "#0485F7",
        validate: () => "pick another",
        validationBehavior: "aria",
      });

      expect(state().realtimeValidation.value.isInvalid).toBe(true);
      expect(state().displayValidation.value.isInvalid).toBe(true);

      unmount();
    });

    it("holds a rejection back until commit under native behaviour", async () => {
      const { state, unmount } = mount({
        defaultValue: "#0485F7",
        validate: () => "pick another",
        validationBehavior: "native",
      });

      expect(state().realtimeValidation.value.isInvalid).toBe(true);
      expect(state().displayValidation.value.isInvalid).toBe(false);

      state().setInputValue("#000000");
      state().commit();
      // A commit is queued a tick out, so the input has taken its bindings and the browser has
      // recomputed its own validity before the verdict is read.
      await nextTick();

      expect(state().displayValidation.value.isInvalid).toBe(true);

      unmount();
    });
  });
});
