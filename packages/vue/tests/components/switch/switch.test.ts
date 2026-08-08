import {renderVapor} from "@heroui/testing/helpers/vue";
import {describe, expect, it, vi} from "vitest";
import {nextTick, reactive} from "vue";

import SwitchFixture from "./fixtures.vue";

const renderSwitch = (props: Record<string, unknown> = {}) => renderVapor(SwitchFixture, {props});

const slot = (container: HTMLElement, name: string) =>
  container.querySelector<HTMLElement>(`[data-slot='${name}']`)!;

const inputIn = (container: HTMLElement) => container.querySelector("input")!;

/** Give a form an id and hand it back, so a switch rendered outside it can point at it. */
let formCounter = 0;

const formId = (form: HTMLFormElement) => {
  form.id = `form-${++formCounter}`;

  return form.id;
};

const clickAndSettle = async (element: HTMLElement) => {
  element.click();
  await nextTick();
};

describe("Switch", () => {
  describe("structure", () => {
    it("renders every part with its data-slot", () => {
      const {container, unmount} = renderSwitch();

      expect(slot(container, "switch")).not.toBeNull();
      expect(slot(container, "switch-content")).not.toBeNull();
      expect(slot(container, "switch-control")).not.toBeNull();
      expect(slot(container, "switch-thumb")).not.toBeNull();

      unmount();
    });

    it("renders the BEM classes of each part", () => {
      const {container, unmount} = renderSwitch();

      expect(slot(container, "switch").classList.contains("switch")).toBe(true);
      expect(slot(container, "switch-content").classList.contains("switch__content")).toBe(true);
      expect(slot(container, "switch-control").classList.contains("switch__control")).toBe(true);
      expect(slot(container, "switch-thumb").classList.contains("switch__thumb")).toBe(true);

      unmount();
    });

    it("renders the clickable content as a label around a hidden switch input", () => {
      const {container, unmount} = renderSwitch();
      const content = slot(container, "switch-content");
      const input = inputIn(container);

      expect(content.tagName).toBe("LABEL");
      expect(input.type).toBe("checkbox");
      expect(input.getAttribute("role")).toBe("switch");
      expect(content.contains(input)).toBe(true);
      // Hidden by styles rather than by `hidden`, so the input keeps its place in the tab
      // order and stays announced.
      expect(input.parentElement?.style.clipPath).toBe("inset(50%)");

      unmount();
    });

    it("renders the icon passed to the thumb", () => {
      const {getByTestId, unmount} = renderSwitch({withIcon: true});

      expect(getByTestId("thumb-icon")).toBeInTheDocument();

      unmount();
    });

    it("exposes the label text as the accessible name", () => {
      const {getByRole, unmount} = renderSwitch();

      expect(getByRole("switch", {name: "Enable notifications"})).toBeInTheDocument();

      unmount();
    });

    it("maps size to the block modifier", () => {
      for (const size of ["sm", "md", "lg"] as const) {
        const {container, unmount} = renderSwitch({size});

        expect(slot(container, "switch").classList.contains(`switch--${size}`)).toBe(true);

        unmount();
      }
    });

    it("merges a caller class into the root", () => {
      const {container, unmount} = renderSwitch({class: "custom-class"});

      expect(slot(container, "switch").classList.contains("custom-class")).toBe(true);
      expect(slot(container, "switch").classList.contains("switch")).toBe(true);

      unmount();
    });
  });

  describe("selection", () => {
    it("starts off", () => {
      const {container, unmount} = renderSwitch();

      expect(inputIn(container).checked).toBe(false);
      expect(slot(container, "switch").hasAttribute("data-selected")).toBe(false);

      unmount();
    });

    it("supports defaultSelected", () => {
      const {container, unmount} = renderSwitch({defaultSelected: true});

      expect(inputIn(container).checked).toBe(true);
      expect(slot(container, "switch").getAttribute("data-selected")).toBe("true");
      expect(slot(container, "switch-content").getAttribute("data-selected")).toBe("true");

      unmount();
    });

    it("toggles when the label is clicked", async () => {
      const {container, unmount} = renderSwitch();

      await clickAndSettle(slot(container, "switch-content"));

      expect(inputIn(container).checked).toBe(true);
      expect(slot(container, "switch").getAttribute("data-selected")).toBe("true");

      await clickAndSettle(slot(container, "switch-content"));

      expect(inputIn(container).checked).toBe(false);
      expect(slot(container, "switch").hasAttribute("data-selected")).toBe(false);

      unmount();
    });

    it("toggles when the input itself is clicked", async () => {
      const {container, unmount} = renderSwitch();

      await clickAndSettle(inputIn(container));

      expect(slot(container, "switch").getAttribute("data-selected")).toBe("true");

      unmount();
    });

    it("calls change with the new value", async () => {
      const onChange = vi.fn();
      const {container, unmount} = renderSwitch({onChange});

      await clickAndSettle(slot(container, "switch-content"));

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenLastCalledWith(true);

      unmount();
    });

    it("leaves a controlled switch to its owner", async () => {
      const onChange = vi.fn();
      const props = reactive({isSelected: false, onChange});
      const {container, unmount} = renderVapor(SwitchFixture, {props});

      await clickAndSettle(slot(container, "switch-content"));

      expect(onChange).toHaveBeenLastCalledWith(true);
      // The owner declined the change, so both the state and the input stay put.
      expect(inputIn(container).checked).toBe(false);
      expect(slot(container, "switch").hasAttribute("data-selected")).toBe(false);

      props.isSelected = true;
      await nextTick();

      expect(inputIn(container).checked).toBe(true);
      expect(slot(container, "switch").getAttribute("data-selected")).toBe("true");

      unmount();
    });
  });

  describe("states", () => {
    it("supports isDisabled", async () => {
      const onChange = vi.fn();
      const {container, unmount} = renderSwitch({isDisabled: true, onChange});

      expect(inputIn(container).disabled).toBe(true);
      expect(slot(container, "switch").getAttribute("data-disabled")).toBe("true");
      expect(slot(container, "switch-content").getAttribute("data-disabled")).toBe("true");

      await clickAndSettle(slot(container, "switch-content"));

      expect(onChange).not.toHaveBeenCalled();
      expect(inputIn(container).checked).toBe(false);

      unmount();
    });

    it("supports isReadOnly", async () => {
      const onChange = vi.fn();
      const {container, unmount} = renderSwitch({isReadOnly: true, onChange});

      expect(inputIn(container).getAttribute("aria-readonly")).toBe("true");
      // Focusable, unlike a disabled switch — the value can be read, just not changed.
      expect(inputIn(container).disabled).toBe(false);

      await clickAndSettle(slot(container, "switch-content"));

      expect(onChange).not.toHaveBeenCalled();
      expect(inputIn(container).checked).toBe(false);

      unmount();
    });

    it("supports isInvalid", () => {
      const {container, unmount} = renderSwitch({isInvalid: true});

      expect(inputIn(container).getAttribute("aria-invalid")).toBe("true");
      expect(slot(container, "switch").getAttribute("data-invalid")).toBe("true");

      unmount();
    });

    it("supports isRequired", () => {
      const {container, unmount} = renderSwitch({isRequired: true});

      expect(inputIn(container).required).toBe(true);
      expect(slot(container, "switch").getAttribute("data-required")).toBe("true");

      unmount();
    });
  });

  describe("interaction states", () => {
    it("renders data-hovered while the pointer is over the content", async () => {
      const {container, unmount} = renderSwitch();
      const content = slot(container, "switch-content");

      content.dispatchEvent(new PointerEvent("pointerenter", {pointerType: "mouse"}));
      await nextTick();

      expect(content.getAttribute("data-hovered")).toBe("true");

      content.dispatchEvent(new PointerEvent("pointerleave", {pointerType: "mouse"}));
      await nextTick();

      expect(content.hasAttribute("data-hovered")).toBe(false);

      unmount();
    });

    it("renders data-pressed while the pointer is down", async () => {
      const {container, unmount} = renderSwitch();
      const content = slot(container, "switch-content");

      content.dispatchEvent(new PointerEvent("pointerdown", {bubbles: true, button: 0}));
      await nextTick();

      expect(content.getAttribute("data-pressed")).toBe("true");

      window.dispatchEvent(new PointerEvent("pointerup"));
      await nextTick();

      expect(content.hasAttribute("data-pressed")).toBe(false);

      unmount();
    });

    it("renders data-pressed while Space is held", async () => {
      const {container, unmount} = renderSwitch();
      const content = slot(container, "switch-content");
      const input = inputIn(container);

      input.dispatchEvent(new KeyboardEvent("keydown", {bubbles: true, key: " "}));
      await nextTick();

      expect(content.getAttribute("data-pressed")).toBe("true");

      input.dispatchEvent(new KeyboardEvent("keyup", {bubbles: true, key: " "}));
      await nextTick();

      expect(content.hasAttribute("data-pressed")).toBe(false);

      unmount();
    });

    it("renders data-focused while the input holds focus", async () => {
      const {container, unmount} = renderSwitch();
      const content = slot(container, "switch-content");

      inputIn(container).focus();
      await nextTick();

      expect(content.getAttribute("data-focused")).toBe("true");

      inputIn(container).blur();
      await nextTick();

      expect(content.hasAttribute("data-focused")).toBe(false);

      unmount();
    });
  });

  describe("help text", () => {
    it("points the input at a description that is rendered", async () => {
      const {container, unmount} = renderSwitch({withDescription: true});
      const description = slot(container, "description");

      // The description claims its id as it mounts, so the input picks it up on the
      // following flush — before paint, but after the first render.
      await nextTick();

      expect(description.id).not.toBe("");
      expect(inputIn(container).getAttribute("aria-describedby")).toBe(description.id);

      unmount();
    });

    it("leaves aria-describedby off when there is no help text", () => {
      const {container, unmount} = renderSwitch();

      expect(inputIn(container).hasAttribute("aria-describedby")).toBe(false);

      unmount();
    });
  });

  describe("forms", () => {
    it("submits the name and value of a switch that is on", () => {
      const form = document.createElement("form");

      document.body.append(form);

      const {container, unmount} = renderSwitch({
        defaultSelected: true,
        form: formId(form),
        name: "notifications",
      });

      expect(inputIn(container).form).toBe(form);
      expect(new FormData(form).get("notifications")).toBe("on");

      unmount();
      form.remove();
    });

    it("submits nothing for a switch that is off", () => {
      const form = document.createElement("form");

      document.body.append(form);

      const {unmount} = renderSwitch({form: formId(form), name: "notifications"});

      expect(new FormData(form).get("notifications")).toBeNull();

      unmount();
      form.remove();
    });

    it("submits a caller value in place of the native one", () => {
      const {container, unmount} = renderSwitch({
        defaultSelected: true,
        name: "notifications",
        value: "enabled",
      });

      expect(inputIn(container).value).toBe("enabled");

      unmount();
    });

    it("leaves the input at the native on when no value is given", () => {
      const {container, unmount} = renderSwitch({name: "notifications"});

      expect(inputIn(container).value).toBe("on");

      unmount();
    });

    it("goes back to its default when the form is reset", async () => {
      const form = document.createElement("form");

      document.body.append(form);

      const {container, unmount} = renderSwitch({
        defaultSelected: true,
        form: formId(form),
        name: "notifications",
      });

      await clickAndSettle(slot(container, "switch-content"));
      expect(inputIn(container).checked).toBe(false);

      form.reset();
      await nextTick();

      expect(inputIn(container).checked).toBe(true);
      expect(slot(container, "switch").getAttribute("data-selected")).toBe("true");

      unmount();
      form.remove();
    });
  });
});
