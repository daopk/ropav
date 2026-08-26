import type { SelectFixtureItem, SelectHostProps } from "../fixtures/select.types";
import type { UseSelectReturn } from "@/composables/use-select";
import type { UseSelectStateReturn } from "@/composables/use-select-state";

import { renderVapor } from "@ropav/testing/helpers/vue";
import { afterEach, describe, expect, it, vi } from "vitest";
import { nextTick } from "vue";

import Host from "../fixtures/select-host.vue";

const cleanups: Array<() => void> = [];

afterEach(() => {
  while (cleanups.length > 0) cleanups.pop()?.();
});

const mount = (props: SelectHostProps = {}) => {
  let state!: UseSelectStateReturn<SelectFixtureItem>;
  let select!: UseSelectReturn;

  const result = renderVapor(Host, {
    props: {
      ...props,
      onReady: (next: UseSelectStateReturn<SelectFixtureItem>) => (state = next),
      onSelectReady: (next: UseSelectReturn) => (select = next),
    },
  });

  cleanups.push(result.unmount);

  const trigger = result.container.querySelector<HTMLElement>('[data-testid="trigger"]')!;

  return { select, state, trigger };
};

const press = (element: Element, key: string) => {
  element.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key }));
};

const type = (element: Element, text: string) => {
  for (const key of text) press(element, key);
};

describe("useSelect", () => {
  describe("the trigger's wiring", () => {
    it("announces that it opens a listbox", () => {
      const { trigger } = mount();

      expect(trigger).toHaveAttribute("aria-haspopup", "listbox");
      expect(trigger).toHaveAttribute("aria-expanded", "false");
      expect(trigger).not.toHaveAttribute("aria-controls");
    });

    it("points aria-controls at the listbox only while open", async () => {
      const { select, state, trigger } = mount();

      state.open();
      await nextTick();

      expect(trigger).toHaveAttribute("aria-expanded", "true");
      expect(trigger).toHaveAttribute("aria-controls", select.listId.value);
    });

    it("is named by its value first and its label second", () => {
      const { select, trigger } = mount({ ariaLabelledby: "field-label" });

      expect(trigger).toHaveAttribute("aria-labelledby", `${select.valueId.value} field-label`);
    });

    it("names the listbox by the trigger itself when only aria-label is given", () => {
      const { select } = mount({ ariaLabel: "State" });

      expect(select.labelledBy.value).toBe(select.triggerId.value);
    });

    it("carries the invalid state, and leaves required off a role that cannot take it", () => {
      const { trigger } = mount({ isInvalid: true, isRequired: true });

      expect(trigger).toHaveAttribute("aria-invalid", "true");
      // `aria-required` is not supported on `role="button"`, so assistive technology drops it -
      // rendering it only made the gap look covered. The hidden native select carries `required`.
      expect(trigger).not.toHaveAttribute("aria-required");
    });

    it("omits the state attributes it is not in", () => {
      const { trigger } = mount();

      expect(trigger).not.toHaveAttribute("aria-required");
      expect(trigger).not.toHaveAttribute("aria-invalid");
      expect(trigger).not.toBeDisabled();
    });

    it("is disabled when the select is", () => {
      const { trigger } = mount({ isDisabled: true });

      expect(trigger).toBeDisabled();
    });
  });

  describe("opening by keyboard", () => {
    it("opens on ArrowDown from the first option", async () => {
      const { state, trigger } = mount();

      press(trigger, "ArrowDown");
      await nextTick();

      expect(state.isOpen.value).toBe(true);
      expect(state.focusStrategy.value).toBe("first");
    });

    it("opens on ArrowUp from the last option", async () => {
      const { state, trigger } = mount();

      press(trigger, "ArrowUp");
      await nextTick();

      expect(state.isOpen.value).toBe(true);
      expect(state.focusStrategy.value).toBe("last");
    });

    it("stays shut while disabled", async () => {
      const { state, trigger } = mount({ isDisabled: true });

      press(trigger, "ArrowDown");
      await nextTick();

      expect(state.isOpen.value).toBe(false);
    });
  });

  describe("stepping through options on a closed trigger", () => {
    it("moves to the next option on ArrowRight without opening", async () => {
      const onChange = vi.fn();
      const { state, trigger } = mount({ defaultValue: "florida", onChange });

      press(trigger, "ArrowRight");
      await nextTick();

      expect(onChange).toHaveBeenCalledWith("california");
      expect(state.isOpen.value).toBe(false);
    });

    it("moves to the previous option on ArrowLeft", async () => {
      const onChange = vi.fn();
      const { trigger } = mount({ defaultValue: "california", onChange });

      press(trigger, "ArrowLeft");
      await nextTick();

      expect(onChange).toHaveBeenCalledWith("florida");
    });

    it("starts at the first option when nothing is chosen yet", async () => {
      const onChange = vi.fn();
      const { trigger } = mount({ onChange });

      press(trigger, "ArrowRight");
      await nextTick();

      expect(onChange).toHaveBeenCalledWith("florida");
    });

    it("stops at the ends", async () => {
      const onChange = vi.fn();
      const { trigger } = mount({ defaultValue: "texas", onChange });

      press(trigger, "ArrowRight");
      await nextTick();

      expect(onChange).not.toHaveBeenCalled();
    });

    it("does nothing in multiple mode, where there is no next choice", async () => {
      const onChange = vi.fn();
      const { trigger } = mount({
        defaultValue: ["florida"],
        onChange,
        selectionMode: "multiple",
      });

      press(trigger, "ArrowRight");
      await nextTick();

      expect(onChange).not.toHaveBeenCalled();
    });

    it("leaves the arrow keys to the listbox once open", async () => {
      const onChange = vi.fn();
      const { state, trigger } = mount({ defaultOpen: true, defaultValue: "florida", onChange });

      press(trigger, "ArrowRight");
      await nextTick();

      expect(onChange).not.toHaveBeenCalled();
      expect(state.isOpen.value).toBe(true);
    });
  });

  describe("typing to choose", () => {
    it("jumps to the option whose name starts with what was typed", async () => {
      const onChange = vi.fn();
      const { state, trigger } = mount({ onChange });

      type(trigger, "te");
      await nextTick();

      expect(onChange).toHaveBeenLastCalledWith("texas");
      expect(state.isOpen.value).toBe(false);
    });

    it("matches without regard to case", async () => {
      const onChange = vi.fn();
      const { trigger } = mount({ onChange });

      type(trigger, "CAL");
      await nextTick();

      expect(onChange).toHaveBeenLastCalledWith("california");
    });

    it("is off in multiple mode", async () => {
      const onChange = vi.fn();
      const { trigger } = mount({ onChange, selectionMode: "multiple" });

      type(trigger, "te");
      await nextTick();

      expect(onChange).not.toHaveBeenCalled();
    });

    it("is off while disabled", async () => {
      const onChange = vi.fn();
      const { trigger } = mount({ isDisabled: true, onChange });

      type(trigger, "te");
      await nextTick();

      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe("focus", () => {
    it("reports focus arriving and leaving", () => {
      const onFocusChange = vi.fn();
      const { state, trigger } = mount({ onFocusChange });

      trigger.dispatchEvent(new FocusEvent("focus"));

      expect(onFocusChange).toHaveBeenCalledWith(true);
      expect(state.isFocused.value).toBe(true);

      trigger.dispatchEvent(new FocusEvent("blur"));

      expect(onFocusChange).toHaveBeenLastCalledWith(false);
      expect(state.isFocused.value).toBe(false);
    });

    it("does not report leaving while the popover is open", () => {
      const onFocusChange = vi.fn();
      const { state, trigger } = mount({ defaultOpen: true, onFocusChange });

      trigger.dispatchEvent(new FocusEvent("focus"));
      onFocusChange.mockClear();

      // Focus moved into the popover, which is rendered at the end of the document — still
      // inside the select as far as the user is concerned.
      trigger.dispatchEvent(new FocusEvent("blur"));

      expect(onFocusChange).not.toHaveBeenCalled();
      expect(state.isFocused.value).toBe(true);
    });
  });

  describe("labelling", () => {
    it("hands out no ids for parts that never rendered", () => {
      const { select, trigger } = mount();

      expect(select.fieldIds.labelId.value).toBeUndefined();
      expect(trigger).not.toHaveAttribute("aria-describedby");
    });

    it("renders the label as a span, since the trigger is a composite", () => {
      const { select } = mount();

      expect(select.fieldIds.context.labelElementType).toBe("span");
    });

    it("moves focus to the trigger when the label is clicked", () => {
      const { select, trigger } = mount();

      select.fieldIds.context.onLabelClick?.();

      expect(trigger).toHaveFocus();
    });

    it("leaves focus alone when a disabled select's label is clicked", () => {
      const { select, trigger } = mount({ isDisabled: true });

      select.fieldIds.context.onLabelClick?.();

      expect(trigger).not.toHaveFocus();
    });

    it("keeps a caller's aria-describedby", () => {
      const { trigger } = mount({ ariaDescribedby: "outside-hint" });

      expect(trigger).toHaveAttribute("aria-describedby", "outside-hint");
    });
  });
});
