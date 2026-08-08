import {renderVapor} from "@heroui/testing/helpers/vue";
import {describe, expect, it, vi} from "vitest";
import {nextTick, reactive} from "vue";

import SliderFixture from "./fixtures.vue";

const renderSlider = (props: Record<string, unknown> = {}) => renderVapor(SliderFixture, {props});

const slot = (container: HTMLElement, name: string) =>
  container.querySelector<HTMLElement>(`[data-slot='${name}']`)!;

const slots = (container: HTMLElement, name: string) =>
  Array.from(container.querySelectorAll<HTMLElement>(`[data-slot='${name}']`));

const inputIn = (container: HTMLElement) => container.querySelector("input")!;

const key = (element: HTMLElement, keyName: string, init: KeyboardEventInit = {}) => {
  element.dispatchEvent(
    new KeyboardEvent("keydown", {bubbles: true, cancelable: true, key: keyName, ...init}),
  );

  return nextTick();
};

describe("Slider", () => {
  describe("structure", () => {
    it("renders every part with its data-slot", async () => {
      const {container, unmount} = renderSlider({defaultValue: 30});

      await nextTick();

      expect(slot(container, "slider")).not.toBeNull();
      expect(slot(container, "slider-output")).not.toBeNull();
      expect(slot(container, "slider-track")).not.toBeNull();
      expect(slot(container, "slider-fill")).not.toBeNull();
      expect(slot(container, "slider-thumb")).not.toBeNull();

      unmount();
    });

    it("renders the BEM classes of each part", () => {
      const {container, unmount} = renderSlider({defaultValue: 30});

      expect(slot(container, "slider").classList.contains("slider")).toBe(true);
      expect(slot(container, "slider-output").classList.contains("slider__output")).toBe(true);
      expect(slot(container, "slider-track").classList.contains("slider__track")).toBe(true);
      expect(slot(container, "slider-fill").classList.contains("slider__fill")).toBe(true);
      expect(slot(container, "slider-thumb").classList.contains("slider__thumb")).toBe(true);

      unmount();
    });

    it("groups the thumbs and names the group by its label", async () => {
      const {container, unmount} = renderSlider({defaultValue: 30});

      await nextTick();

      const group = slot(container, "slider");
      const label = slot(container, "label");

      expect(group.getAttribute("role")).toBe("group");
      expect(label.id).not.toBe("");
      expect(group.getAttribute("aria-labelledby")).toBe(label.id);
      // Each thumb is announced with the slider's name as well as its own value.
      expect(inputIn(container).getAttribute("aria-labelledby")).toBe(label.id);

      unmount();
    });

    it("names the group itself when there is no visible label", () => {
      const {container, unmount} = renderSlider({
        ariaLabel: "Volume",
        defaultValue: 30,
        withoutLabel: true,
      });

      const group = slot(container, "slider");

      expect(group.getAttribute("aria-label")).toBe("Volume");
      expect(group.hasAttribute("aria-labelledby")).toBe(false);
      // With no label element, the group is what carries the name.
      expect(inputIn(container).getAttribute("aria-labelledby")).toBe(group.id);

      unmount();
    });

    it("renders the thumb value as a range input", () => {
      const {container, unmount} = renderSlider({defaultValue: 30, maxValue: 200, step: 5});
      const input = inputIn(container);

      expect(input.type).toBe("range");
      expect(input.min).toBe("0");
      expect(input.max).toBe("200");
      expect(input.step).toBe("5");
      expect(input.value).toBe("30");
      expect(input.getAttribute("aria-valuetext")).toBe("30");
      expect(input.getAttribute("aria-orientation")).toBe("horizontal");

      unmount();
    });

    it("points the output at every thumb", async () => {
      const {container, unmount} = renderSlider({defaultValue: [100, 500], maxValue: 1000});

      await nextTick();

      const output = slot(container, "slider-output");
      const ids = slots(container, "slider-thumb").map((thumb) => thumb.querySelector("input")!.id);

      expect(output.getAttribute("for")).toBe(ids.join(" "));
      expect(output.getAttribute("aria-live")).toBe("off");

      unmount();
    });

    it("merges a caller class into the root", () => {
      const {container, unmount} = renderSlider({class: "custom-class", defaultValue: 30});

      expect(slot(container, "slider").classList.contains("custom-class")).toBe(true);
      expect(slot(container, "slider").classList.contains("slider")).toBe(true);

      unmount();
    });
  });

  describe("value", () => {
    it("shows the value in the output", () => {
      const {container, unmount} = renderSlider({defaultValue: 30});

      expect(slot(container, "slider-output").textContent).toContain("30");

      unmount();
    });

    it("shows both ends of a range in the output", async () => {
      const {container, unmount} = renderSlider({defaultValue: [100, 500], maxValue: 1000});

      await nextTick();

      expect(slot(container, "slider-output").textContent).toContain("100 – 500");

      unmount();
    });

    it("formats the value the way the caller asked", () => {
      const {container, unmount} = renderSlider({
        defaultValue: 30,
        formatOptions: {currency: "USD", style: "currency"},
      });

      expect(slot(container, "slider-output").textContent).toContain("$30.00");
      expect(inputIn(container).getAttribute("aria-valuetext")).toBe("$30.00");

      unmount();
    });

    it("renders one thumb per value", async () => {
      const {container, unmount} = renderSlider({defaultValue: [100, 500], maxValue: 1000});

      await nextTick();

      expect(slots(container, "slider-thumb").length).toBe(2);

      unmount();
    });

    it("follows a controlled value", async () => {
      const props = reactive({value: 20});
      const {container, unmount} = renderVapor(SliderFixture, {props});

      expect(inputIn(container).value).toBe("20");

      props.value = 80;
      await nextTick();

      expect(inputIn(container).value).toBe("80");
      expect(slot(container, "slider-thumb").style.left).toBe("80%");

      unmount();
    });

    it("calls change while moving and changeEnd once the interaction is over", async () => {
      const onChange = vi.fn();
      const onChangeEnd = vi.fn();
      const {container, unmount} = renderSlider({
        defaultValue: 30,
        onChange,
        onChangeEnd,
        step: 10,
      });

      await key(slot(container, "slider-thumb"), "ArrowRight");

      expect(onChange).toHaveBeenCalledWith(40);
      expect(onChangeEnd).toHaveBeenCalledTimes(1);
      expect(onChangeEnd).toHaveBeenCalledWith(40);

      unmount();
    });
  });

  describe("geometry", () => {
    it("fills the track up to the thumb", () => {
      const {container, unmount} = renderSlider({defaultValue: 30});
      const fill = slot(container, "slider-fill");

      expect(fill.style.left).toBe("0%");
      expect(fill.style.width).toBe("30%");
      expect(slot(container, "slider-thumb").style.left).toBe("30%");

      unmount();
    });

    it("fills between the thumbs of a range", async () => {
      const {container, unmount} = renderSlider({defaultValue: [200, 600], maxValue: 1000});

      await nextTick();

      const fill = slot(container, "slider-fill");

      expect(fill.style.left).toBe("20%");
      expect(fill.style.width).toBe("40%");

      unmount();
    });

    it("fills upwards on a vertical slider", () => {
      const {container, unmount} = renderSlider({defaultValue: 30, orientation: "vertical"});
      const fill = slot(container, "slider-fill");

      expect(fill.style.bottom).toBe("0%");
      expect(fill.style.height).toBe("30%");
      // The thumb is positioned from the top, so its offset is the other way round.
      expect(slot(container, "slider-thumb").style.top).toBe("70%");

      unmount();
    });

    it("keeps the track able to take a drag", () => {
      const {container, unmount} = renderSlider({defaultValue: 30});
      const track = slot(container, "slider-track");

      expect(track.style.position).toBe("relative");
      expect(track.style.touchAction).toBe("none");

      unmount();
    });
  });

  describe("track ends", () => {
    it("marks the start as filled once the thumb has left it", () => {
      const {container, unmount} = renderSlider({defaultValue: 30});
      const track = slot(container, "slider-track");

      expect(track.getAttribute("data-fill-start")).toBe("true");
      expect(track.hasAttribute("data-fill-end")).toBe(false);

      unmount();
    });

    it("marks neither end when a single thumb sits at the minimum", () => {
      const {container, unmount} = renderSlider({defaultValue: 0});
      const track = slot(container, "slider-track");

      expect(track.hasAttribute("data-fill-start")).toBe(false);
      expect(track.hasAttribute("data-fill-end")).toBe(false);

      unmount();
    });

    it("marks both ends when a single thumb sits at the maximum", () => {
      const {container, unmount} = renderSlider({defaultValue: 100});
      const track = slot(container, "slider-track");

      expect(track.getAttribute("data-fill-start")).toBe("true");
      expect(track.getAttribute("data-fill-end")).toBe("true");

      unmount();
    });

    it("marks an end of a range only when a thumb is parked on it", async () => {
      const {container, unmount} = renderSlider({defaultValue: [0, 50]});

      await nextTick();

      const track = slot(container, "slider-track");

      expect(track.getAttribute("data-fill-start")).toBe("true");
      expect(track.hasAttribute("data-fill-end")).toBe(false);

      unmount();
    });

    it("marks no end of a range that touches neither", async () => {
      const {container, unmount} = renderSlider({defaultValue: [20, 80]});

      await nextTick();

      const track = slot(container, "slider-track");

      expect(track.hasAttribute("data-fill-start")).toBe(false);
      expect(track.hasAttribute("data-fill-end")).toBe(false);

      unmount();
    });
  });

  describe("keyboard", () => {
    it("steps with the arrows and pages with shift", async () => {
      const {container, unmount} = renderSlider({defaultValue: 50, step: 5});
      const thumb = slot(container, "slider-thumb");

      await key(thumb, "ArrowRight");
      expect(inputIn(container).value).toBe("55");

      await key(thumb, "ArrowLeft");
      expect(inputIn(container).value).toBe("50");

      await key(thumb, "ArrowRight", {shiftKey: true});
      expect(inputIn(container).value).toBe("60");

      unmount();
    });

    it("pages and jumps to the ends", async () => {
      const {container, unmount} = renderSlider({defaultValue: 50});
      const thumb = slot(container, "slider-thumb");

      await key(thumb, "PageUp");
      expect(inputIn(container).value).toBe("60");

      await key(thumb, "PageDown");
      expect(inputIn(container).value).toBe("50");

      await key(thumb, "Home");
      expect(inputIn(container).value).toBe("0");

      await key(thumb, "End");
      expect(inputIn(container).value).toBe("100");

      unmount();
    });

    it("stops a range thumb at its neighbour", async () => {
      const {container, unmount} = renderSlider({defaultValue: [20, 80]});

      await nextTick();

      const [low] = slots(container, "slider-thumb");

      await key(low!, "End");

      expect(low!.querySelector("input")!.value).toBe("80");

      unmount();
    });
  });

  describe("disabled", () => {
    it("marks every part and takes the thumb out of the tab order", () => {
      const {container, unmount} = renderSlider({defaultValue: 30, isDisabled: true});

      expect(slot(container, "slider").getAttribute("data-disabled")).toBe("true");
      expect(slot(container, "slider-output").getAttribute("data-disabled")).toBe("true");
      expect(slot(container, "slider-track").getAttribute("data-disabled")).toBe("true");
      expect(slot(container, "slider-fill").getAttribute("data-disabled")).toBe("true");
      expect(slot(container, "slider-thumb").getAttribute("data-disabled")).toBe("true");
      expect(inputIn(container).disabled).toBe(true);
      expect(inputIn(container).hasAttribute("tabindex")).toBe(false);

      unmount();
    });

    it("ignores the keyboard", async () => {
      const onChange = vi.fn();
      const {container, unmount} = renderSlider({
        defaultValue: 30,
        isDisabled: true,
        onChange,
      });

      await key(slot(container, "slider-thumb"), "ArrowRight");
      await key(slot(container, "slider-thumb"), "End");

      expect(onChange).not.toHaveBeenCalled();
      expect(inputIn(container).value).toBe("30");

      unmount();
    });
  });

  describe("orientation", () => {
    it("reports the orientation on every part that is styled by it", () => {
      const {container, unmount} = renderSlider({defaultValue: 30, orientation: "vertical"});

      expect(slot(container, "slider").getAttribute("data-orientation")).toBe("vertical");
      expect(slot(container, "slider-output").getAttribute("data-orientation")).toBe("vertical");
      expect(slot(container, "slider-track").getAttribute("data-orientation")).toBe("vertical");
      expect(inputIn(container).getAttribute("aria-orientation")).toBe("vertical");

      unmount();
    });
  });

  describe("interaction states", () => {
    it("renders data-hovered while the pointer is over the track", async () => {
      const {container, unmount} = renderSlider({defaultValue: 30});
      const track = slot(container, "slider-track");

      track.dispatchEvent(new PointerEvent("pointerenter", {pointerType: "mouse"}));
      await nextTick();

      expect(track.getAttribute("data-hovered")).toBe("true");

      track.dispatchEvent(new PointerEvent("pointerleave", {pointerType: "mouse"}));
      await nextTick();

      expect(track.hasAttribute("data-hovered")).toBe(false);

      unmount();
    });

    it("renders data-focused on the thumb while its input holds focus", async () => {
      const {container, unmount} = renderSlider({defaultValue: 30});
      const thumb = slot(container, "slider-thumb");

      inputIn(container).focus();
      await nextTick();

      expect(thumb.getAttribute("data-focused")).toBe("true");

      inputIn(container).blur();
      await nextTick();

      expect(thumb.hasAttribute("data-focused")).toBe(false);

      unmount();
    });
  });

  describe("forms", () => {
    it("submits the thumb value under its name", () => {
      const form = document.createElement("form");

      form.id = "slider-form";
      document.body.append(form);

      const {container, unmount} = renderSlider({
        defaultValue: 30,
        form: form.id,
        name: "volume",
      });

      expect(inputIn(container).form).toBe(form);
      expect(new FormData(form).get("volume")).toBe("30");

      unmount();
      form.remove();
    });

    it("goes back to its default when the form is reset", async () => {
      const form = document.createElement("form");

      form.id = "slider-reset-form";
      document.body.append(form);

      const {container, unmount} = renderSlider({
        defaultValue: 30,
        form: form.id,
        name: "volume",
        step: 10,
      });

      await nextTick();
      await key(slot(container, "slider-thumb"), "ArrowRight");
      expect(inputIn(container).value).toBe("40");

      form.reset();
      await nextTick();

      expect(inputIn(container).value).toBe("30");

      unmount();
      form.remove();
    });
  });

  describe("label", () => {
    it("hands focus to the first thumb when the label is clicked", async () => {
      const {container, unmount} = renderSlider({defaultValue: 30});

      await nextTick();
      slot(container, "label").click();

      expect(document.activeElement).toBe(inputIn(container));

      unmount();
    });

    it("leaves the label without a for, so the thumb keeps its own name", async () => {
      const {container, unmount} = renderSlider({defaultValue: 30});

      await nextTick();

      expect(slot(container, "label").hasAttribute("for")).toBe(false);

      unmount();
    });
  });
});
