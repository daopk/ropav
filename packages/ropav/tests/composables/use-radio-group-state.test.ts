import type { RadioGroupState } from "@/composables";

import { renderVapor } from "@ropav/testing/helpers/vue";
import { describe, expect, it, vi } from "vitest";
import { nextTick, reactive } from "vue";

import Host from "../fixtures/radio-group-state-host.vue";

const renderGroup = (props: Record<string, unknown> = {}) => {
  let state!: RadioGroupState;

  Object.assign(props, { onReady: (ready: RadioGroupState) => (state = ready) });

  const rendered = renderVapor(Host, { props });
  const input = (value: string) =>
    rendered.container.querySelector<HTMLInputElement>(`[data-testid='input-${value}']`)!;

  return { ...rendered, input, state };
};

describe("useRadioGroupState", () => {
  describe("name", () => {
    it("mints one when the caller gives none", () => {
      const { state, unmount } = renderGroup();

      expect(state.name.value).toBeTruthy();

      unmount();
    });

    it("uses the caller's name", () => {
      const { state, unmount } = renderGroup({ name: "plan" });

      expect(state.name.value).toBe("plan");

      unmount();
    });

    it("shares one name across every radio, which is what groups them", () => {
      const { input, unmount } = renderGroup({ values: ["basic", "premium"] });

      expect(input("basic").name).toBe(input("premium").name);

      unmount();
    });
  });

  describe("selection", () => {
    it("starts with nothing selected", () => {
      const { state, unmount } = renderGroup();

      expect(state.selectedValue.value).toBeNull();

      unmount();
    });

    it("honours the default value while uncontrolled", () => {
      const { state, unmount } = renderGroup({ defaultValue: "premium" });

      expect(state.selectedValue.value).toBe("premium");

      unmount();
    });

    it("replaces the selection rather than adding to it", () => {
      const { state, unmount } = renderGroup({ defaultValue: "basic" });

      state.setSelectedValue("premium");

      expect(state.selectedValue.value).toBe("premium");

      unmount();
    });

    it("reports every change to the caller", () => {
      const onValueChange = vi.fn();
      const { state, unmount } = renderGroup({ onValueChange });

      state.setSelectedValue("basic");

      expect(onValueChange).toHaveBeenCalledWith("basic");

      unmount();
    });

    it("leaves its own state alone while controlled", async () => {
      const props = reactive({ onValueChange: vi.fn(), value: "basic" });
      const { state, unmount } = renderGroup(props);

      state.setSelectedValue("premium");
      await nextTick();

      expect(state.selectedValue.value).toBe("basic");
      expect(props.onValueChange).toHaveBeenCalledWith("premium");

      unmount();
    });

    it("keeps only one radio checked at a time", async () => {
      const { input, state, unmount } = renderGroup({ values: ["basic", "premium"] });

      state.setSelectedValue("basic");
      await nextTick();
      expect(input("basic").checked).toBe(true);

      state.setSelectedValue("premium");
      await nextTick();

      expect(input("premium").checked).toBe(true);
      expect(input("basic").checked).toBe(false);

      unmount();
    });
  });

  describe("read-only and disabled", () => {
    it("refuses a change while read-only", () => {
      const { state, unmount } = renderGroup({ isReadOnly: true });

      state.setSelectedValue("basic");

      expect(state.selectedValue.value).toBeNull();

      unmount();
    });

    it("refuses a change while disabled", () => {
      const { state, unmount } = renderGroup({ isDisabled: true });

      state.setSelectedValue("basic");

      expect(state.selectedValue.value).toBeNull();

      unmount();
    });
  });

  describe("reset value", () => {
    it("goes back to the default value when uncontrolled", () => {
      const { state, unmount } = renderGroup({ defaultValue: "basic" });

      state.setSelectedValue("premium");

      expect(state.defaultSelectedValue.value).toBe("basic");

      unmount();
    });

    it("goes back to what a controlled group first held", async () => {
      const props = reactive({ value: "basic" as string | null });
      const { state, unmount } = renderGroup(props);

      props.value = "premium";
      await nextTick();

      // A controlled `value` describes the present, so the starting point is captured once.
      expect(state.defaultSelectedValue.value).toBe("basic");

      unmount();
    });
  });

  describe("focus memory", () => {
    it("starts with no remembered radio", () => {
      const { state, unmount } = renderGroup();

      expect(state.lastFocusedValue.value).toBeNull();

      unmount();
    });

    it("remembers the radio focus last rested on", () => {
      const { state, unmount } = renderGroup();

      state.setLastFocusedValue("premium");

      expect(state.lastFocusedValue.value).toBe("premium");

      unmount();
    });
  });

  describe("validation", () => {
    it("commits as soon as a radio is chosen", async () => {
      const { state, unmount } = renderGroup({
        validate: (value: string | null) => (value === "basic" ? "not that one" : true),
      });

      state.setSelectedValue("basic");
      await nextTick();
      await nextTick();

      expect(state.isInvalid.value).toBe(true);

      unmount();
    });

    it("announces requiredness whatever is selected", () => {
      const { state, unmount } = renderGroup({ defaultValue: "basic", isRequired: true });

      // Unlike a checkbox group, this needs no emulation: `required` is name-scoped.
      expect(state.isRequired.value).toBe(true);

      unmount();
    });

    it("lets a controlled isInvalid take the group over", () => {
      const { state, unmount } = renderGroup({ isInvalid: true });

      expect(state.isInvalid.value).toBe(true);

      unmount();
    });

    it("treats an absent isInvalid as no claim at all", () => {
      const { state, unmount } = renderGroup();

      expect(state.isInvalid.value).toBe(false);

      unmount();
    });
  });

  describe("native required", () => {
    it("reports valueMissing on every radio while nothing is chosen", () => {
      const { input, unmount } = renderGroup({ isRequired: true, values: ["basic", "premium"] });

      expect(input("basic").validity.valueMissing).toBe(true);
      expect(input("premium").validity.valueMissing).toBe(true);

      unmount();
    });

    it("clears it across the whole named group once one is chosen", async () => {
      const { input, state, unmount } = renderGroup({
        isRequired: true,
        values: ["basic", "premium"],
      });

      state.setSelectedValue("basic");
      await nextTick();

      // The browser scopes the constraint by name, so choosing one satisfies its siblings.
      expect(input("basic").validity.valueMissing).toBe(false);
      expect(input("premium").validity.valueMissing).toBe(false);

      unmount();
    });

    it("blocks a submit until one is chosen", async () => {
      const onSubmit = vi.fn((event: Event) => event.preventDefault());
      const { container, state, unmount } = renderGroup({
        isRequired: true,
        values: ["basic", "premium"],
      });
      const press = () =>
        container.querySelector<HTMLButtonElement>("[data-testid='submit']")!.click();

      container.querySelector("form")!.addEventListener("submit", onSubmit);

      press();
      expect(onSubmit).not.toHaveBeenCalled();

      state.setSelectedValue("basic");
      await nextTick();
      press();

      expect(onSubmit).toHaveBeenCalledOnce();

      unmount();
    });

    it("leaves the constraint off under aria behaviour", () => {
      const { input, unmount } = renderGroup({
        isRequired: true,
        validationBehavior: "aria",
        values: ["basic"],
      });

      expect(input("basic").required).toBe(false);

      unmount();
    });
  });
});
