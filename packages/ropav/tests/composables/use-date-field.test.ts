import type {DateFieldReady, TimeFieldReady} from "../fixtures/date-field.types";

import {renderVapor} from "@heroui/testing/helpers/vue";
import {CalendarDate, Time} from "@internationalized/date";
import {describe, expect, it, vi} from "vitest";
import {nextTick} from "vue";

import Harness from "../fixtures/date-field-harness.vue";
import TimeHost from "../fixtures/time-field-host.vue";
import {expectResetSource} from "../harness/form-reset";

const setup = (props: Record<string, unknown> = {}) => {
  let ready!: DateFieldReady;

  Object.assign(props, {
    locale: props["locale"] ?? "en-US",
    onReady: (value: DateFieldReady) => (ready = value),
  });

  const result = renderVapor(Harness, {props});
  const find = <T extends HTMLElement>(slot: string) =>
    result.container.querySelector<T>(`[data-slot='${slot}']`)!;

  return {
    ...result,
    group: () => find("group"),
    input: () => find<HTMLInputElement>("input"),
    label: () => find("label"),
    ready: () => ready,
    segments: () => [...find("group").querySelectorAll<HTMLElement>("[data-slot='segment']")],
  };
};

const setupTime = (props: Record<string, unknown> = {}) => {
  let ready!: TimeFieldReady;

  Object.assign(props, {onReady: (value: TimeFieldReady) => (ready = value)});

  const result = renderVapor(TimeHost, {props});

  return {
    ...result,
    input: () => result.container.querySelector<HTMLInputElement>("[data-slot='input']")!,
    ready: () => ready,
  };
};

/** The segment for one part of the date. */
const part = (field: ReturnType<typeof setup>, name: string) => {
  const index = field.ready().state.segments.value.findIndex((segment) => segment.type === name);

  return field.segments()[index]!;
};

const type = async (target: HTMLElement, data: string) => {
  target.dispatchEvent(
    new InputEvent("beforeinput", {bubbles: true, cancelable: true, data, inputType: "insertText"}),
  );
  await nextTick();
};

/** Move focus out of the field, which is what settles whatever is half typed into it. */
const leave = async (from: HTMLElement) => {
  const outside = document.createElement("button");

  document.body.appendChild(outside);
  outside.focus();
  from.dispatchEvent(new FocusEvent("focusout", {bubbles: true, relatedTarget: outside}));
  await nextTick();

  return () => outside.remove();
};

describe("useDateField", () => {
  describe("the group around the segments", () => {
    it("is a group naming itself", () => {
      const field = setup({ariaLabel: "Birth date"});

      expect(field.group().getAttribute("role")).toBe("group");
      expect(field.group().getAttribute("aria-label")).toBe("Birth date");
      field.unmount();
    });

    it("points at its own visible label", () => {
      const field = setup({label: "Birth date"});
      const labelledBy = field.group().getAttribute("aria-labelledby");

      expect(labelledBy).toBe(field.label().id);
      expect(labelledBy).toBeTruthy();
      field.unmount();
    });

    it("keeps its segments in a run of their own", () => {
      // Left to itself the field would be laid out by whatever text surrounds it.
      const field = setup({});

      expect(field.group().style.unicodeBidi).toBe("isolate");
      field.unmount();
    });

    it("describes the value in words", () => {
      const field = setup({defaultValue: new CalendarDate(2026, 6, 5)});
      const describedBy = field.group().getAttribute("aria-describedby")!;
      const description = document.getElementById(describedBy.split(" ")[0]!);

      // Segment by segment the value is three numbers; this is what makes it a date.
      expect(description?.textContent).toBe("Selected Date: June 5, 2026");
      field.unmount();
    });

    it("says nothing about a value it has not got", () => {
      const field = setup({});

      expect(field.group().getAttribute("aria-describedby")).toBeNull();
      field.unmount();
    });

    it("also points at a description of its own", async () => {
      const field = setup({defaultValue: new CalendarDate(2026, 6, 5), description: "When born"});

      // The description claims its id as it mounts, which is after the group first rendered.
      await nextTick();

      const ids = field.group().getAttribute("aria-describedby")!.split(" ");

      expect(ids).toHaveLength(2);
      expect(document.getElementById(ids[1]!)?.textContent).toBe("When born");
      field.unmount();
    });

    it("reports itself disabled", () => {
      const field = setup({isDisabled: true});

      expect(field.group().getAttribute("aria-disabled")).toBe("true");
      field.unmount();
    });
  });

  describe("inside a picker", () => {
    it("steps out of the way entirely", () => {
      /*
       * The picker already carries the group role, its label and its description, and the segments
       * are labelled by all of it — a second group here would be announced twice over.
       */
      const field = setup({ariaLabel: "Birth date", role: "presentation"});

      expect(field.group().getAttribute("role")).toBe("presentation");
      expect(field.group().getAttribute("aria-label")).toBeNull();
      expect(field.group().getAttribute("aria-labelledby")).toBeNull();
      field.unmount();
    });

    it("carries the id the picker gave it, and nothing else", () => {
      /*
       * The id is the one prop that survives upstream's filter on the way into a presentational
       * field, so it is the one attribute besides the role that appears.
       */
      const field = setup({ariaDescribedBy: "hint", id: "the-field", role: "presentation"});
      const group = field.group();

      expect(group.getAttribute("id")).toBe("the-field");
      expect(group.getAttribute("aria-describedby")).toBeNull();
      field.unmount();
    });

    it("renders no id when the picker gave it none", () => {
      // A range picker names neither of its two fields, and a minted id would be one React has not.
      const field = setup({role: "presentation"});

      expect(field.group().hasAttribute("id")).toBe(false);
      field.unmount();
    });

    it("leaves the arrow keys to the picker", () => {
      // A picker steers one row of segments across two fields, so a field cannot steer its own.
      const field = setup({role: "presentation"});
      const month = part(field, "month");

      month.focus();

      const event = new KeyboardEvent("keydown", {
        bubbles: true,
        cancelable: true,
        key: "ArrowRight",
      });

      month.dispatchEvent(event);

      expect(event.defaultPrevented).toBe(false);
      field.unmount();
    });
  });

  describe("the hidden input a form reads", () => {
    it("carries the value under its name", () => {
      const field = setup({defaultValue: new CalendarDate(2026, 6, 5), name: "born"});

      expect(field.input().getAttribute("name")).toBe("born");
      expect(field.input().value).toBe("2026-06-05");
      field.unmount();
    });

    it("carries the value a reset restores from", async () => {
      /*
       * The binding writes the property alone, and under native validation this is a real control
       * — `type="text"` plus `hidden` — so a real reset restores it from the default asserted here
       * and would otherwise blank it while the segments still show the date. Not visible to a jsdom
       * reset, which is synchronous and lets the post-flush state mirror cover the gap.
       */
      const field = setup({
        defaultValue: new CalendarDate(2026, 6, 5),
        name: "born",
        validationBehavior: "native",
      });

      await nextTick();
      expectResetSource(field.input(), "2026-06-05");
      field.unmount();
    });

    it("carries the time alone for a time field, not the date it holds", async () => {
      // One source for the string, which is the whole reason `inputValue` exists: a watcher reading
      // the field's own value would re-assert a full date over the time a form is meant to receive.
      const field = setupTime({defaultValue: new Time(9, 30), name: "at"});

      await nextTick();
      expect(field.input().value).toBe("09:30:00");
      expectResetSource(field.input(), "09:30:00");
      field.unmount();
    });

    it("is a hidden text input under native validation", () => {
      /*
       * Only a real control takes part in constraint validation, so `type="hidden"` would let an
       * empty required field submit.
       */
      const field = setup({isRequired: true, validationBehavior: "native"});

      expect(field.input().type).toBe("text");
      expect(field.input().hasAttribute("hidden")).toBe(true);
      expect(field.input().hasAttribute("required")).toBe(true);
      field.unmount();
    });

    it("needs no control of its own under aria validation", () => {
      const field = setup({isRequired: true, validationBehavior: "aria"});

      expect(field.input().type).toBe("hidden");
      expect(field.input().hasAttribute("required")).toBe(false);
      field.unmount();
    });

    it("goes disabled with the field", () => {
      const field = setup({isDisabled: true});

      expect(field.input().hasAttribute("disabled")).toBe(true);
      field.unmount();
    });
  });

  describe("focus", () => {
    it("reports focus arriving and leaving, but not moving along", async () => {
      const onFocusChange = vi.fn();
      const field = setup({onFocusChange});
      const month = part(field, "month");
      const day = part(field, "day");

      month.dispatchEvent(new FocusEvent("focusin", {bubbles: true}));
      await nextTick();
      expect(onFocusChange).toHaveBeenCalledTimes(1);
      expect(onFocusChange).toHaveBeenLastCalledWith(true);

      // Moving between segments still fires a focusout, but the field never lost focus.
      month.dispatchEvent(new FocusEvent("focusout", {bubbles: true, relatedTarget: day}));
      day.dispatchEvent(new FocusEvent("focusin", {bubbles: true}));
      await nextTick();
      expect(onFocusChange).toHaveBeenCalledTimes(1);

      const cleanUp = await leave(day);

      expect(onFocusChange).toHaveBeenLastCalledWith(false);
      cleanUp();
      field.unmount();
    });

    it("settles an impossible date on the way out", async () => {
      const onChange = vi.fn();
      const field = setup({onChange});
      const day = part(field, "day");

      await type(part(field, "month"), "2");
      await type(part(field, "day"), "3");
      await type(part(field, "day"), "0");
      await type(part(field, "year"), "2026");

      // February 30 is complete but is not a date, so it sits on screen uncommitted.
      expect(onChange).not.toHaveBeenCalled();

      day.dispatchEvent(new FocusEvent("focusin", {bubbles: true}));
      const cleanUp = await leave(day);

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange.mock.calls[0]?.[0]?.toString()).toBe("2026-02-28");
      cleanUp();
      field.unmount();
    });

    it("puts focus on the first segment when asked to", async () => {
      const field = setup({autoFocus: true});

      await nextTick();

      expect(document.activeElement).toBe(part(field, "month"));
      field.unmount();
    });

    it("hands focus to the first segment when its label is clicked", () => {
      // A label naming a group cannot point `for` at anything, so the click has to be answered.
      const field = setup({label: "Birth date"});

      field.label().click();

      expect(document.activeElement).toBe(part(field, "month"));
      field.unmount();
    });

    it("reports focus being anywhere inside", async () => {
      const field = setup({});

      expect(field.group().getAttribute("data-focus-within")).toBeNull();

      part(field, "month").dispatchEvent(new FocusEvent("focusin", {bubbles: true}));
      await nextTick();

      expect(field.group().getAttribute("data-focus-within")).toBe("true");
      field.unmount();
    });
  });

  describe("validation", () => {
    it("reports what is wrong with the value", () => {
      const field = setup({
        defaultValue: new CalendarDate(2026, 1, 1),
        minValue: new CalendarDate(2026, 6, 1),
        validationBehavior: "aria",
      });

      expect(field.ready().field.isInvalid.value).toBe(true);
      expect(field.ready().field.validationErrors.value).toEqual([
        "Value must be 6/1/2026 or later.",
      ]);
      expect(field.ready().field.validationDetails.value.rangeUnderflow).toBe(true);
      field.unmount();
    });

    it("accepts a value inside the range", () => {
      const field = setup({
        defaultValue: new CalendarDate(2026, 6, 5),
        minValue: new CalendarDate(2026, 6, 1),
        validationBehavior: "aria",
      });

      expect(field.ready().field.isInvalid.value).toBe(false);
      expect(field.ready().field.validationErrors.value).toEqual([]);
      field.unmount();
    });
  });
});

describe("useTimeField", () => {
  it("submits the time rather than the date it travelled as", () => {
    // The date only ever existed so the segment machinery had something whole to work with.
    const field = setupTime({defaultValue: new Time(13, 45), name: "at"});

    expect(field.input().value).toBe("13:45:00");
    field.unmount();
  });

  it("submits nothing while it is empty", () => {
    const field = setupTime({name: "at"});

    expect(field.input().value).toBe("");
    field.unmount();
  });

  it("describes the time in words", () => {
    const field = setupTime({defaultValue: new Time(13, 45)});
    const group = field.container.querySelector<HTMLElement>("[data-slot='group']")!;
    const describedBy = group.getAttribute("aria-describedby")!;

    expect(document.getElementById(describedBy.split(" ")[0]!)?.textContent).toBe(
      "Selected Time: 1:45 PM",
    );
    field.unmount();
  });
});
