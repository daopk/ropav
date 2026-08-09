import type {UseInputOTPReturn} from "@/composables/use-input-otp";

import {renderVapor} from "@heroui/testing/helpers/vue";
import {afterEach, describe, expect, it, vi} from "vitest";
import {nextTick} from "vue";

import Host from "../fixtures/input-otp-host.vue";

const mount = (props: Record<string, unknown> = {}) => {
  let otp!: UseInputOTPReturn;

  const result = renderVapor(Host, {
    props: {
      maxLength: 6,
      onReady: (next: UseInputOTPReturn) => (otp = next),
      ...props,
    },
  });

  const at = (testId: string) =>
    result.container.querySelector<HTMLElement>(`[data-testid='${testId}']`)!;

  return {
    ...result,
    container: result.container,
    control: () => at("control") as HTMLInputElement,
    otp: () => otp,
    slotEls: () => [...result.container.querySelectorAll<HTMLElement>("[data-testid='slot']")],
  };
};

const type = (control: HTMLInputElement, value: string) => {
  control.value = value;
  control.dispatchEvent(new Event("input"));
};

/**
 * A paste event carrying text.
 *
 * jsdom has no `DataTransfer`, so the payload is attached by hand. What a real clipboard does is
 * covered in the browser suite; this exercises the branch that decides what the paste replaces.
 */
const pasteEvent = (text: string) => {
  const event = new Event("paste", {bubbles: true, cancelable: true});

  Object.defineProperty(event, "clipboardData", {value: {getData: () => text}});

  return event;
};

/**
 * Makes the engine believe it is on iOS.
 *
 * The paste handler only takes over from the browser there — everywhere else the native paste
 * already does the right thing — so the branch is unreachable without saying so.
 */
const pretendIOS = () => {
  const original = window.CSS;

  Object.defineProperty(window, "CSS", {
    configurable: true,
    value: {...original, supports: () => true},
    writable: true,
  });

  return () => {
    Object.defineProperty(window, "CSS", {configurable: true, value: original, writable: true});
  };
};

afterEach(() => {
  document.getElementById("input-otp-style")?.remove();
});

describe("useInputOTP", () => {
  describe("value", () => {
    it("reports what was typed and tells the caller", () => {
      const onChange = vi.fn();
      const {control, otp, unmount} = mount({onChange});

      type(control(), "12");

      expect(otp().value.value).toBe("12");
      expect(onChange).toHaveBeenCalledWith("12");

      unmount();
    });

    it("takes no more characters than the code is long", () => {
      const {control, otp, unmount} = mount({maxLength: 4});

      type(control(), "1234567");

      expect(otp().value.value).toBe("1234");

      unmount();
    });

    it("starts from the default value", () => {
      const {otp, unmount} = mount({defaultValue: "12"});

      expect(otp().value.value).toBe("12");

      unmount();
    });

    it("keeps the caller's value when the caller declines the change", async () => {
      const {control, otp, unmount} = mount({value: "12"});

      type(control(), "123");
      await nextTick();

      expect(otp().value.value).toBe("12");
      expect(control().value).toBe("12");

      unmount();
    });
  });

  describe("pattern", () => {
    it("refuses a value the pattern does not allow", () => {
      const onChange = vi.fn();
      const {control, otp, unmount} = mount({onChange, pattern: "^[a-zA-Z]+$"});

      type(control(), "12");

      expect(otp().value.value).toBe("");
      expect(onChange).not.toHaveBeenCalled();

      unmount();
    });

    it("puts the refused characters back on the control", () => {
      const {control, unmount} = mount({defaultValue: "ab", pattern: "^[a-zA-Z]+$"});

      type(control(), "ab1");

      expect(control().value).toBe("ab");

      unmount();
    });

    it("accepts a value the pattern allows", () => {
      const {control, otp, unmount} = mount({pattern: /^\d+$/});

      type(control(), "12");

      expect(otp().value.value).toBe("12");

      unmount();
    });

    it("exposes the pattern to the browser as well", () => {
      const {control, unmount} = mount({pattern: "^[a-zA-Z]+$"});

      expect(control()).toHaveAttribute("pattern", "^[a-zA-Z]+$");

      unmount();
    });
  });

  describe("completion", () => {
    // Reported once the change has settled rather than from inside the event, matching where
    // React runs it — after the commit, not during the keystroke.
    it("calls onComplete when the last slot fills", async () => {
      const onComplete = vi.fn();
      const {control, unmount} = mount({maxLength: 4, onComplete});

      type(control(), "123");
      await nextTick();
      expect(onComplete).not.toHaveBeenCalled();

      type(control(), "1234");
      await nextTick();
      expect(onComplete).toHaveBeenCalledWith("1234");

      unmount();
    });

    it("does not call onComplete for a code that arrives already full", async () => {
      const onComplete = vi.fn();
      const {unmount} = mount({defaultValue: "1234", maxLength: 4, onComplete});

      await nextTick();

      expect(onComplete).not.toHaveBeenCalled();

      unmount();
    });

    it("does not call onComplete again while the code stays full", async () => {
      const onComplete = vi.fn();
      const {control, unmount} = mount({maxLength: 4, onComplete});

      type(control(), "1234");
      await nextTick();
      expect(onComplete).toHaveBeenCalledTimes(1);

      type(control(), "5678");
      await nextTick();
      expect(onComplete).toHaveBeenCalledTimes(1);

      unmount();
    });
  });

  describe("slot states", () => {
    it("reports one slot per character the code is long", () => {
      const {otp, unmount} = mount({maxLength: 4});

      expect(otp().slotStates.value).toHaveLength(4);

      unmount();
    });

    it("hands each slot its own character, and null past the end", () => {
      const {control, otp, unmount} = mount({maxLength: 4});

      type(control(), "ab");

      expect(otp().slotStates.value.map((slot) => slot.char)).toEqual(["a", "b", null, null]);

      unmount();
    });

    it("shows the placeholder only while nothing at all is typed", () => {
      const {control, otp, unmount} = mount({maxLength: 4, placeholder: "····"});

      expect(otp().slotStates.value.map((slot) => slot.placeholderChar)).toEqual([
        "·",
        "·",
        "·",
        "·",
      ]);

      type(control(), "a");

      expect(otp().slotStates.value.every((slot) => slot.placeholderChar === null)).toBe(true);

      unmount();
    });

    it("marks the slot the caret is on as active", () => {
      const {control, otp, unmount} = mount({maxLength: 4});

      control().focus();
      otp().handlers.onFocus();

      expect(otp().slotStates.value.map((slot) => slot.isActive)).toEqual([
        true,
        false,
        false,
        false,
      ]);

      unmount();
    });

    it("marks every slot a selection covers as active", () => {
      const {control, otp, unmount} = mount({defaultValue: "abc", maxLength: 4});

      control().focus();
      control().setSelectionRange(0, 2);
      document.dispatchEvent(new Event("selectionchange"));

      const active = otp().slotStates.value.map((slot) => slot.isActive);

      expect(active).toEqual([true, true, false, false]);

      unmount();
    });

    it("draws a caret only on an active slot with nothing in it", () => {
      const {control, otp, unmount} = mount({defaultValue: "a", maxLength: 4});

      control().focus();
      otp().handlers.onFocus();

      const states = otp().slotStates.value;

      expect(states[1]!.isActive).toBe(true);
      expect(states[1]!.hasFakeCaret).toBe(true);
      expect(states[0]!.hasFakeCaret).toBe(false);

      unmount();
    });

    it("reports no active slot while focus is elsewhere", () => {
      const {control, otp, unmount} = mount({defaultValue: "ab", maxLength: 4});

      control().focus();
      otp().handlers.onFocus();
      otp().handlers.onBlur();

      expect(otp().slotStates.value.every((slot) => !slot.isActive)).toBe(true);

      unmount();
    });
  });

  describe("focus", () => {
    it("puts the caret on the first empty slot", () => {
      const {control, otp, unmount} = mount({defaultValue: "ab", maxLength: 6});

      control().focus();
      otp().handlers.onFocus();

      expect(control().selectionStart).toBe(2);
      expect(control().selectionEnd).toBe(2);

      unmount();
    });

    it("puts the caret on the last slot when the code is full", () => {
      const {control, otp, unmount} = mount({defaultValue: "abcd", maxLength: 4});

      control().focus();
      otp().handlers.onFocus();

      expect(control().selectionStart).toBe(3);
      expect(control().selectionEnd).toBe(4);

      unmount();
    });
  });

  describe("selection mirroring", () => {
    it("snaps a caret at the start onto the first character", () => {
      const {control, otp, unmount} = mount({defaultValue: "abcd", maxLength: 4});

      control().focus();
      control().setSelectionRange(0, 0);
      document.dispatchEvent(new Event("selectionchange"));

      expect(control().selectionStart).toBe(0);
      expect(control().selectionEnd).toBe(1);
      expect(otp().slotStates.value[0]!.isActive).toBe(true);

      unmount();
    });

    it("snaps a caret at the end onto the last character", () => {
      const {control, otp, unmount} = mount({defaultValue: "abcd", maxLength: 4});

      control().focus();
      control().setSelectionRange(4, 4);
      document.dispatchEvent(new Event("selectionchange"));

      expect(control().selectionStart).toBe(3);
      expect(control().selectionEnd).toBe(4);
      expect(otp().slotStates.value[3]!.isActive).toBe(true);

      unmount();
    });

    it("leaves the caret between slots while there is still room to type", () => {
      const {control, unmount} = mount({defaultValue: "ab", maxLength: 4});

      control().focus();
      control().setSelectionRange(2, 2);
      document.dispatchEvent(new Event("selectionchange"));

      expect(control().selectionStart).toBe(2);
      expect(control().selectionEnd).toBe(2);

      unmount();
    });

    it("publishes the mirrored selection on the control", async () => {
      const {control, unmount} = mount({defaultValue: "abcd", maxLength: 4});

      control().focus();
      control().setSelectionRange(0, 0);
      document.dispatchEvent(new Event("selectionchange"));
      await nextTick();

      expect(control()).toHaveAttribute("data-input-otp-mss", "0");
      expect(control()).toHaveAttribute("data-input-otp-mse", "1");

      unmount();
    });

    it("drops the mirror when the control is not the focused element", async () => {
      const {control, unmount} = mount({defaultValue: "abcd", maxLength: 4});

      control().focus();
      control().setSelectionRange(0, 0);
      document.dispatchEvent(new Event("selectionchange"));
      await nextTick();

      control().blur();
      document.dispatchEvent(new Event("selectionchange"));
      await nextTick();

      expect(control()).not.toHaveAttribute("data-input-otp-mss");
      expect(control()).not.toHaveAttribute("data-input-otp-mse");

      unmount();
    });
  });

  describe("paste", () => {
    it("inserts pasted text at the caret", () => {
      const restore = pretendIOS();
      const {control, otp, unmount} = mount({defaultValue: "ab", maxLength: 6});

      control().setSelectionRange(2, 2);
      control().dispatchEvent(pasteEvent("cd"));

      expect(otp().value.value).toBe("abcd");

      unmount();
      restore();
    });

    it("replaces the selection when there is one", () => {
      const restore = pretendIOS();
      const {control, otp, unmount} = mount({defaultValue: "abcd", maxLength: 6});

      control().setSelectionRange(0, 4);
      control().dispatchEvent(pasteEvent("xy"));

      expect(otp().value.value).toBe("xy");

      unmount();
      restore();
    });

    it("takes no more pasted characters than the code is long", () => {
      const restore = pretendIOS();
      const {control, otp, unmount} = mount({maxLength: 4});

      control().setSelectionRange(0, 0);
      control().dispatchEvent(pasteEvent("1234567"));

      expect(otp().value.value).toBe("1234");

      unmount();
      restore();
    });

    it("refuses a paste the pattern does not allow", () => {
      const restore = pretendIOS();
      const {control, otp, unmount} = mount({maxLength: 4, pattern: "^\\d+$"});

      control().setSelectionRange(0, 0);
      control().dispatchEvent(pasteEvent("ab"));

      expect(otp().value.value).toBe("");

      unmount();
      restore();
    });

    it("lets the caller rewrite pasted text, on any platform", () => {
      const {control, otp, unmount} = mount({
        maxLength: 6,
        pasteTransformer: (pasted: string) => pasted.replace(/\D/g, ""),
      });

      control().setSelectionRange(0, 0);
      control().dispatchEvent(pasteEvent("1-2 3"));

      expect(otp().value.value).toBe("123");

      unmount();
    });

    it("leaves the paste to the browser when nothing needs fixing", () => {
      const {control, otp, unmount} = mount({maxLength: 6});
      const event = pasteEvent("123");

      control().dispatchEvent(event);

      expect(event.defaultPrevented).toBe(false);
      expect(otp().value.value).toBe("");

      unmount();
    });
  });

  describe("attributes", () => {
    it("carries no listener key, so nothing is lost through v-bind", () => {
      const {otp, unmount} = mount();

      expect(Object.keys(otp().attrs.value).filter((key) => key.startsWith("on"))).toEqual([]);

      unmount();
    });

    it("asks the platform for a one-time code and a numeric keyboard", () => {
      const {control, unmount} = mount();

      expect(control()).toHaveAttribute("autocomplete", "one-time-code");
      expect(control()).toHaveAttribute("inputmode", "numeric");
      expect(control()).toHaveAttribute("maxlength", "6");
      expect(control()).toHaveAttribute("data-input-otp", "true");

      unmount();
    });

    it("says the field is empty while nothing is typed", async () => {
      const {control, unmount} = mount();

      expect(control()).toHaveAttribute("data-input-otp-placeholder-shown", "true");

      type(control(), "1");
      await nextTick();

      expect(control()).not.toHaveAttribute("data-input-otp-placeholder-shown");

      unmount();
    });

    it("names the field for assistive technology when a placeholder is given", () => {
      const {control, unmount} = mount({placeholder: "······"});

      expect(control()).toHaveAttribute("aria-placeholder", "······");

      unmount();
    });
  });

  describe("engine styles", () => {
    it("installs the rules the stylesheet cannot express, once per document", () => {
      const first = mount();

      expect(document.getElementById("input-otp-style")).not.toBeNull();

      const second = mount();

      expect(document.querySelectorAll("#input-otp-style")).toHaveLength(1);

      first.unmount();
      second.unmount();
    });

    it("tells the container how tall the control came out", () => {
      const {container, unmount} = mount();
      const host = container.querySelector<HTMLElement>("[data-input-otp-container]")!;

      expect(host.style.getPropertyValue("--root-height")).toBe("0px");

      unmount();
    });

    it("stretches the control over the whole field without showing it", () => {
      const {otp, unmount} = mount();

      expect(otp().inputStyle.value).toMatchObject({
        caretColor: "transparent",
        color: "transparent",
        // Opaque on purpose: iOS shows no hold-to-paste menu on a see-through control.
        opacity: "1",

        pointerEvents: "all",
        position: "absolute",
      });

      unmount();
    });

    it("lets a pointer fall through the boxes to the control underneath", () => {
      const {otp, unmount} = mount();

      expect(otp().rootStyle.value["pointerEvents"]).toBe("none");
      expect(otp().rootStyle.value["cursor"]).toBe("text");

      unmount();
    });

    it("shows a disabled field is not for typing in", () => {
      const {otp, unmount} = mount({isDisabled: true});

      expect(otp().rootStyle.value["cursor"]).toBe("default");

      unmount();
    });
  });

  describe("hovering", () => {
    it("reports the pointer over the control", () => {
      const {otp, unmount} = mount();

      otp().handlers.onMouseover();
      expect(otp().isHovering.value).toBe(true);

      otp().handlers.onMouseleave();
      expect(otp().isHovering.value).toBe(false);

      unmount();
    });

    it("reports no hover on a disabled field", () => {
      const {otp, unmount} = mount({isDisabled: true});

      otp().handlers.onMouseover();

      expect(otp().isHovering.value).toBe(false);

      unmount();
    });
  });

  describe("scripting fallback", () => {
    it("hands out styles that make the control usable with no script", () => {
      const {otp, unmount} = mount();

      expect(otp().noScriptCss.value).toContain("[data-input-otp]");

      unmount();
    });

    it("renders none when the caller turns it off", () => {
      const {otp, unmount} = mount({noScriptCSSFallback: null});

      expect(otp().noScriptCss.value).toBeNull();

      unmount();
    });
  });

  describe("self-dispatched input", () => {
    /**
     * The engine dispatches an `input` at the control on a delay, to knock it out of its
     * autofilled state. React never hears that event — it does not bubble, and React listens at
     * the root — while a Vapor listener sits on the element and does. This pins down that the
     * difference stays invisible: the event reports the value already held, so it changes nothing.
     */
    it("reports nothing new when the engine nudges the control itself", () => {
      vi.useFakeTimers();

      const onChange = vi.fn();
      const {control, unmount} = mount({onChange});

      type(control(), "12");
      expect(onChange).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(100);

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(control().value).toBe("12");

      unmount();
      vi.useRealTimers();
    });
  });
});
