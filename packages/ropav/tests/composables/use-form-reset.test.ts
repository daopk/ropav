import { afterEach, describe, expect, it, vi } from "vitest";
import { nextTick, shallowRef } from "vue";

import { useFormReset } from "@/composables/use-form-reset";

import { withScope } from "../harness/scope";

/** A form holding one input, plus a second form to repoint at. */
const mount = () => {
  const form = document.createElement("form");
  const other = document.createElement("form");

  other.id = "other-form";

  const input = document.createElement("input");

  form.appendChild(input);
  document.body.append(form, other);

  return { form, input, other };
};

afterEach(() => {
  document.body.innerHTML = "";
});

describe("useFormReset", () => {
  describe("on reset", () => {
    it("hands the initial value back to the component", async () => {
      const { form, input } = mount();
      const onReset = vi.fn();
      const [, dispose] = withScope(() => useFormReset(shallowRef(input), "default", onReset));

      await nextTick();
      form.reset();

      expect(onReset).toHaveBeenCalledWith("default");

      dispose();
    });

    /*
     * Read when the reset happens, not when the listener was attached, so a default that changes
     * over the component's life resets to the current one.
     */
    it("reads the initial value at reset time", async () => {
      const { form, input } = mount();
      const initial = shallowRef("first");
      const onReset = vi.fn();
      const [, dispose] = withScope(() => useFormReset(shallowRef(input), initial, onReset));

      await nextTick();
      initial.value = "second";
      form.reset();

      expect(onReset).toHaveBeenCalledWith("second");

      dispose();
    });

    /*
     * A cancelled reset leaves the form's values alone, so the state must keep its own.
     *
     * Dispatched already-prevented rather than cancelled by a second listener: whether a listener
     * added later sees `defaultPrevented` depends on registration order, and that ordering is not
     * the behaviour under test.
     */
    it("ignores a reset that was cancelled", async () => {
      const { form, input } = mount();
      const onReset = vi.fn();
      const [, dispose] = withScope(() => useFormReset(shallowRef(input), "default", onReset));

      await nextTick();

      const event = new Event("reset", { cancelable: true });

      event.preventDefault();
      form.dispatchEvent(event);

      expect(onReset).not.toHaveBeenCalled();

      dispose();
    });
  });

  describe("which form it listens to", () => {
    it("listens to no form when the control is not in one", async () => {
      const input = document.createElement("input");

      document.body.appendChild(input);

      const onReset = vi.fn();
      const [, dispose] = withScope(() => useFormReset(shallowRef(input), "default", onReset));

      await nextTick();

      expect(onReset).not.toHaveBeenCalled();

      dispose();
    });

    it("waits for a control that is rendered later", async () => {
      const { form, input } = mount();
      const element = shallowRef<HTMLInputElement | null>(null);
      const onReset = vi.fn();
      const [, dispose] = withScope(() => useFormReset(element, "default", onReset));

      await nextTick();
      form.reset();

      expect(onReset).not.toHaveBeenCalled();

      element.value = input;
      await nextTick();
      form.reset();

      expect(onReset).toHaveBeenCalledWith("default");

      dispose();
    });

    /*
     * Re-attaches when the *ref* moves to a control in another form. Note the limit this pins:
     * the watcher's dependency is the ref, and `element.form` is a plain DOM property, so
     * repointing a mounted control through its `form` attribute alone does not re-attach.
     */
    it("moves to the other form when the ref moves", async () => {
      const { form, input, other } = mount();
      const second = document.createElement("input");

      other.appendChild(second);

      const element = shallowRef<HTMLInputElement | null>(input);
      const onReset = vi.fn();
      const [, dispose] = withScope(() => useFormReset(element, "default", onReset));

      await nextTick();
      element.value = second;
      await nextTick();

      form.reset();

      expect(onReset).not.toHaveBeenCalled();

      other.reset();

      expect(onReset).toHaveBeenCalledWith("default");

      dispose();
    });

    it("detaches when the control goes away", async () => {
      const { form, input } = mount();
      const element = shallowRef<HTMLInputElement | null>(input);
      const onReset = vi.fn();
      const [, dispose] = withScope(() => useFormReset(element, "default", onReset));

      await nextTick();
      element.value = null;
      await nextTick();
      form.reset();

      expect(onReset).not.toHaveBeenCalled();

      dispose();
    });
  });

  describe("teardown", () => {
    it("stops listening once the component is gone", async () => {
      const { form, input } = mount();
      const onReset = vi.fn();
      const [, dispose] = withScope(() => useFormReset(shallowRef(input), "default", onReset));

      await nextTick();
      dispose();
      form.reset();

      expect(onReset).not.toHaveBeenCalled();
    });
  });
});
