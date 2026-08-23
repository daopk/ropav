import type {NumberFieldState} from "@/composables/use-number-field-state";

import {renderVapor} from "@ropav/testing/helpers/vue";
import {describe, expect, it, vi} from "vitest";
import {nextTick, reactive} from "vue";

import Host from "../fixtures/number-field-host.vue";

/**
 * Every expected number here was measured by running the real `react-stately` 3.49.0 and
 * `@internationalized/number` 3.6.7 that this repo has installed, rather than reasoned about.
 * The arithmetic has tie-breaks that do not follow decimal intuition, so guessing would produce
 * tests that agree with the guess instead of with React.
 */
const mount = (props: Record<string, unknown> = {}) => {
  let state!: NumberFieldState;

  const result = renderVapor(Host, {
    props: {locale: "en-US", onReady: (next: NumberFieldState) => (state = next), ...props},
  });

  return {...result, state: () => state};
};

describe("useNumberFieldState", () => {
  describe("formatting", () => {
    it("writes a plain number in the locale's grouping", () => {
      const {state, unmount} = mount({defaultValue: 1234.5});

      expect(state().inputValue.value).toBe("1,234.5");

      unmount();
    });

    it("writes a currency amount with its symbol and decimals", () => {
      const {state, unmount} = mount({
        defaultValue: 1234.5,
        formatOptions: {currency: "USD", style: "currency"},
      });

      expect(state().inputValue.value).toBe("$1,234.50");

      unmount();
    });

    it("writes a percentage as the reader sees it, not as it is stored", () => {
      const {state, unmount} = mount({defaultValue: 0.25, formatOptions: {style: "percent"}});

      expect(state().inputValue.value).toBe("25%");
      expect(state().numberValue.value).toBe(0.25);

      unmount();
    });

    it("writes a unit out in full", () => {
      const {state, unmount} = mount({
        defaultValue: 12,
        formatOptions: {style: "unit", unit: "inch", unitDisplay: "long"},
      });

      expect(state().inputValue.value).toBe("12 inches");

      unmount();
    });

    it("leaves the input empty for no number at all", () => {
      const {state, unmount} = mount();

      expect(state().inputValue.value).toBe("");
      expect(Number.isNaN(state().numberValue.value)).toBe(true);

      unmount();
    });
  });

  describe("typing", () => {
    it("keeps the text and the number apart while a number is half typed", () => {
      // The point of holding two values: `-` is not a number yet, but it has to survive being
      // typed or a negative amount could never be entered.
      const {state, unmount} = mount();

      state().setInputValue("-");

      expect(state().inputValue.value).toBe("-");
      expect(Number.isNaN(state().numberValue.value)).toBe(true);

      unmount();
    });

    it("accepts a partly typed currency amount", () => {
      const {state, unmount} = mount({formatOptions: {currency: "USD", style: "currency"}});

      expect(state().validate("")).toBe(true);
      expect(state().validate("-")).toBe(true);
      expect(state().validate("$")).toBe(true);
      expect(state().validate("$1.")).toBe(true);
      expect(state().validate("$1.2")).toBe(true);
      expect(state().validate("abc")).toBe(false);

      unmount();
    });

    it("rejects a sign the range forbids but allows a number above the maximum", () => {
      // Asymmetric on purpose, and measured: the minimum rules out a negative sign outright,
      // while a value over the maximum is still on its way to being typed.
      const {state, unmount} = mount({maxValue: 10, minValue: 0});

      expect(state().validate("5")).toBe(true);
      expect(state().validate("-5")).toBe(false);
      expect(state().validate("15")).toBe(true);

      unmount();
    });
  });

  describe("committing", () => {
    it("parses the text and writes it back formatted", () => {
      const {state, unmount} = mount({formatOptions: {currency: "USD", style: "currency"}});

      state().setInputValue("1234.5");
      state().commit();

      expect(state().numberValue.value).toBe(1234.5);
      expect(state().inputValue.value).toBe("$1,234.50");

      unmount();
    });

    it("rounds the number to the digits the field actually shows", () => {
      // The value is round-tripped through the formatter, so a field showing two decimals does
      // not keep a third one nobody can see. Measured: 1.005 becomes 1.01, not 1.005.
      const {state, unmount} = mount({
        formatOptions: {maximumFractionDigits: 2, minimumFractionDigits: 2},
      });

      state().setInputValue("1.005");
      state().commit();

      expect(state().numberValue.value).toBe(1.01);
      expect(state().inputValue.value).toBe("1.01");

      unmount();
    });

    it("puts the old number back when the text cannot be parsed", () => {
      const {state, unmount} = mount({defaultValue: 7});

      state().setInputValue("nonsense");
      state().commit();

      expect(state().numberValue.value).toBe(7);
      expect(state().inputValue.value).toBe("7");

      unmount();
    });

    it("clears the number when the text is cleared", () => {
      const {state, unmount} = mount({defaultValue: 7});

      state().setInputValue("");
      state().commit();

      expect(Number.isNaN(state().numberValue.value)).toBe(true);
      expect(state().inputValue.value).toBe("");

      unmount();
    });

    it("pulls the value inside the range and onto a step", () => {
      const {state, unmount} = mount({maxValue: 10, minValue: 0, step: 2});

      state().setInputValue("13");
      state().commit();

      expect(state().numberValue.value).toBe(10);

      unmount();
    });

    it("leaves the value where the user put it under validate behaviour", () => {
      // `"validate"` is the other half of the contract: the value stays out of range so
      // validation has something to object to, rather than being silently corrected.
      const {state, unmount} = mount({
        commitBehavior: "validate",
        maxValue: 10,
        minValue: 0,
        step: 2,
      });

      state().setInputValue("13");
      state().commit();

      expect(state().numberValue.value).toBe(13);

      unmount();
    });

    it("commits a value handed in directly", () => {
      const {state, unmount} = mount();

      state().commit("42");

      expect(state().numberValue.value).toBe(42);

      unmount();
    });
  });

  describe("stepping", () => {
    it("steps a decimal without leaking binary floating point", () => {
      // `1.1 + 0.1` in plain arithmetic is `1.2000000000000002`, which would end up on screen.
      const {state, unmount} = mount({defaultValue: 1.1, step: 0.1});

      state().increment();

      expect(state().numberValue.value).toBe(1.2);
      expect(state().inputValue.value).toBe("1.2");

      unmount();
    });

    it("steps down through a decimal the same way", () => {
      const {state, unmount} = mount({defaultValue: 0.3, step: 0.1});

      state().decrement();

      expect(state().numberValue.value).toBe(0.2);

      unmount();
    });

    it("snaps a value that sits between steps rather than adding a whole one", () => {
      // The off-step value has to be typed rather than passed in: a `defaultValue` is snapped on
      // the way in under the default commit behaviour, so 3 with a step of 2 would already be 4.
      const {state, unmount} = mount({maxValue: 10, minValue: 0, step: 2});

      state().setInputValue("3");
      state().increment();

      expect(state().numberValue.value).toBe(4);

      unmount();
    });

    it("snaps downward from between steps", () => {
      const {state, unmount} = mount({maxValue: 10, minValue: 0, step: 2});

      state().setInputValue("3");
      state().decrement();

      expect(state().numberValue.value).toBe(2);

      unmount();
    });

    it("snaps a default value onto a step on the way in", () => {
      const {state, unmount} = mount({defaultValue: 3, maxValue: 10, minValue: 0, step: 2});

      expect(state().numberValue.value).toBe(4);

      unmount();
    });

    it("lands on 0.4 stepping up from 0.35, not on 0.45", () => {
      // Measured against react-stately. `snapValueToStep(0.35, 0, 1, 0.1)` is 0.3 — the tie
      // breaks on the binary remainder, not the decimal one — so the step is added and the
      // result snapped, which lands on 0.4.
      const {state, unmount} = mount({defaultValue: 0.35, maxValue: 1, minValue: 0, step: 0.1});

      state().increment();

      expect(state().numberValue.value).toBe(0.4);

      unmount();
    });

    it("stops at the maximum", () => {
      const {state, unmount} = mount({defaultValue: 10, maxValue: 10, minValue: 0, step: 1});

      state().increment();

      expect(state().numberValue.value).toBe(10);

      unmount();
    });

    it("keeps a step inside the range when the step would overshoot", () => {
      const {state, unmount} = mount({defaultValue: 7, maxValue: 10, minValue: 0, step: 3});

      state().increment();

      expect(state().numberValue.value).toBe(9);

      unmount();
    });

    it("starts from the minimum when incrementing an empty field", () => {
      const {state, unmount} = mount({maxValue: 20, minValue: 5, step: 1});

      state().increment();

      expect(state().numberValue.value).toBe(5);

      unmount();
    });

    it("starts from the maximum when decrementing an empty field", () => {
      const {state, unmount} = mount({maxValue: 20, minValue: 5, step: 1});

      state().decrement();

      expect(state().numberValue.value).toBe(20);

      unmount();
    });

    it("starts from zero when an empty field has no range", () => {
      const {state, unmount} = mount({step: 1});

      state().increment();

      expect(state().numberValue.value).toBe(0);

      unmount();
    });

    it("moves a percentage by one point when no step is given", () => {
      // A percent field with no step of its own steps by a hundredth, because that is one
      // percentage point on screen rather than one whole multiple.
      const {state, unmount} = mount({defaultValue: 0.25, formatOptions: {style: "percent"}});

      state().increment();

      expect(state().inputValue.value).toBe("26%");

      unmount();
    });

    it("jumps to the ends of the range", () => {
      const {state, unmount} = mount({defaultValue: 5, maxValue: 10, minValue: 2, step: 1});

      state().incrementToMax();
      expect(state().numberValue.value).toBe(10);

      state().decrementToMin();
      expect(state().numberValue.value).toBe(2);

      unmount();
    });

    it("does nothing at the ends when there is no range", () => {
      const {state, unmount} = mount({defaultValue: 5});

      state().incrementToMax();
      state().decrementToMin();

      expect(state().numberValue.value).toBe(5);

      unmount();
    });

    it("rewrites the text when the step lands on the number already held", () => {
      // Type over the shown value with a half-finished version of the same number, then step:
      // the number does not change, so nothing would re-render, and the half-finished text
      // would be left on screen.
      const {state, unmount} = mount({defaultValue: 5, step: 1});

      state().setInputValue("4");
      state().increment();

      expect(state().numberValue.value).toBe(5);
      expect(state().inputValue.value).toBe("5");

      unmount();
    });
  });

  describe("what the steppers allow", () => {
    it("allows both directions in the middle of the range", () => {
      const {state, unmount} = mount({defaultValue: 5, maxValue: 10, minValue: 0, step: 1});

      expect(state().canIncrement.value).toBe(true);
      expect(state().canDecrement.value).toBe(true);

      unmount();
    });

    it("stops incrementing at the maximum and decrementing at the minimum", () => {
      const atMax = mount({defaultValue: 10, maxValue: 10, minValue: 0, step: 1});

      expect(atMax.state().canIncrement.value).toBe(false);
      expect(atMax.state().canDecrement.value).toBe(true);
      atMax.unmount();

      const atMin = mount({defaultValue: 0, maxValue: 10, minValue: 0, step: 1});

      expect(atMin.state().canIncrement.value).toBe(true);
      expect(atMin.state().canDecrement.value).toBe(false);
      atMin.unmount();
    });

    it("allows both directions from an empty field", () => {
      const {state, unmount} = mount({maxValue: 10, minValue: 0, step: 1});

      expect(state().canIncrement.value).toBe(true);
      expect(state().canDecrement.value).toBe(true);

      unmount();
    });

    it("allows neither while disabled or read-only", () => {
      const disabled = mount({defaultValue: 5, isDisabled: true});

      expect(disabled.state().canIncrement.value).toBe(false);
      expect(disabled.state().canDecrement.value).toBe(false);
      disabled.unmount();

      const readOnly = mount({defaultValue: 5, isReadOnly: true});

      expect(readOnly.state().canIncrement.value).toBe(false);
      expect(readOnly.state().canDecrement.value).toBe(false);
      readOnly.unmount();
    });
  });

  describe("controlled and uncontrolled", () => {
    it("reports a change to its owner", () => {
      const onChange = vi.fn();
      const {state, unmount} = mount({defaultValue: 5, onChange, step: 1});

      state().increment();

      expect(onChange).toHaveBeenCalledWith(6);

      unmount();
    });

    it("keeps a controlled field at the value its owner holds", () => {
      const onChange = vi.fn();
      const {state, unmount} = mount({onChange, step: 1, value: 5});

      state().increment();

      expect(onChange).toHaveBeenCalledWith(6);
      expect(state().numberValue.value).toBe(5);
      expect(state().inputValue.value).toBe("5");

      unmount();
    });

    it("snaps a controlled value onto the range and the step", () => {
      const {state, unmount} = mount({maxValue: 10, minValue: 0, step: 2, value: 13});

      expect(state().numberValue.value).toBe(10);

      unmount();
    });

    it("reads null as no number", () => {
      const {state, unmount} = mount({value: null});

      expect(Number.isNaN(state().numberValue.value)).toBe(true);
      expect(state().inputValue.value).toBe("");

      unmount();
    });

    it("keeps the value a form reset goes back to", () => {
      const {state, unmount} = mount({defaultValue: 5, step: 1});

      state().increment();

      expect(state().numberValue.value).toBe(6);
      expect(state().defaultNumberValue.value).toBe(5);

      unmount();
    });
  });

  describe("reformatting", () => {
    it("rewrites the text when the format changes underneath it", async () => {
      let state!: NumberFieldState;
      const props = reactive<Record<string, unknown>>({
        defaultValue: 1234.5,
        // Declared up front rather than added later: a key absent at mount is not one the props
        // were resolved from, so adding it would not reach the component.
        formatOptions: undefined,
        locale: "en-US",
        onReady: (next: NumberFieldState) => (state = next),
      });

      const result = renderVapor(Host, {props});

      expect(state.inputValue.value).toBe("1,234.5");

      props["formatOptions"] = {currency: "USD", style: "currency"};
      await nextTick();

      expect(state.inputValue.value).toBe("$1,234.50");

      result.unmount();
    });

    it("leaves the text alone when the format options are rewritten identically", async () => {
      // A caller writing the options inline hands over a fresh object every render. Compared by
      // reference, that would rewrite the input on each one and drop whatever was half typed.
      let state!: NumberFieldState;
      const props = reactive<Record<string, unknown>>({
        formatOptions: {maximumFractionDigits: 2},
        locale: "en-US",
        onReady: (next: NumberFieldState) => (state = next),
      });

      const result = renderVapor(Host, {props});

      state.setInputValue("1.2");
      props["formatOptions"] = {maximumFractionDigits: 2};
      await nextTick();

      expect(state.inputValue.value).toBe("1.2");

      result.unmount();
    });

    it("writes the number in the requested locale", () => {
      const {state, unmount} = mount({defaultValue: 1234.5, locale: "de-DE"});

      expect(state().inputValue.value).toBe("1.234,5");

      unmount();
    });

    it("reads the number back in that locale", async () => {
      const {state, unmount} = mount({locale: "de-DE"});

      state().setInputValue("1.234,5");
      await nextTick();
      state().commit();

      expect(state().numberValue.value).toBe(1234.5);

      unmount();
    });
  });
});
