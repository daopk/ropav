import {describe, expect, it} from "vitest";

import {setFormChecked, setFormValue} from "@/utils/form-value";

const build = (markup: string) => {
  const form = document.createElement("form");

  form.innerHTML = markup;
  document.body.append(form);

  return form;
};

describe("setFormValue", () => {
  it("writes the property and the default an input is restored from", () => {
    const form = build(`<input type="text" />`);
    const input = form.querySelector("input")!;

    setFormValue(input, "hello");

    expect(input.value).toBe("hello");
    // `defaultValue` reflects, so the attribute a reset reads is observable either way.
    expect(input.getAttribute("value")).toBe("hello");
  });

  it("writes the child text content a textarea is restored from", () => {
    const form = build(`<textarea></textarea>`);
    const textarea = form.querySelector("textarea")!;

    setFormValue(textarea, "hello");

    expect(textarea.value).toBe("hello");
    // A textarea has no `value` attribute at all — its default lives in its children, which is
    // the reason this util reaches for `defaultValue` rather than `setAttribute`.
    expect(textarea.textContent).toBe("hello");
    expect(textarea.childNodes).toHaveLength(1);
  });

  it("does not disturb the caret when the text already agrees", () => {
    const form = build(`<input type="text" />`);
    const input = form.querySelector("input")!;

    // The shape a watcher sees mid-typing: the browser has already moved the text, so the state
    // catching up finds the property correct and only the default is left to write. Re-writing
    // `value` would send the caret to the end, which is why the guard is not an optimisation.
    input.value = "hello";
    input.setSelectionRange(2, 2);

    setFormValue(input, "hello");

    expect(input.value).toBe("hello");
    expect(input.selectionStart).toBe(2);
    expect(input.getAttribute("value")).toBe("hello");
  });

  it("moves the text when the state says something else", () => {
    const form = build(`<input type="text" />`);
    const input = form.querySelector("input")!;

    // A rejected keystroke: the browser moved the text, the owner declined, so both halves go
    // back to what the state holds.
    input.value = "typed";
    setFormValue(input, "hello");

    expect(input.value).toBe("hello");
    expect(input.getAttribute("value")).toBe("hello");
  });

  it("is what makes a reset put the control back", () => {
    const form = build(`<input type="text" /><textarea></textarea>`);
    const input = form.querySelector("input")!;
    const textarea = form.querySelector("textarea")!;

    setFormValue(input, "hello");
    setFormValue(textarea, "there");
    input.value = "typed";
    textarea.value = "typed";

    form.reset();

    expect(input.value).toBe("hello");
    expect(textarea.value).toBe("there");
  });

  it("takes a control that has not registered yet", () => {
    expect(() => {
      setFormValue(null, "hello");
      setFormValue(undefined, "hello");
    }).not.toThrow();
  });
});

describe("setFormChecked", () => {
  it("writes the property and the default a checkbox is restored from", () => {
    const form = build(`<input type="checkbox" />`);
    const input = form.querySelector("input")!;

    setFormChecked(input, true);

    expect(input.checked).toBe(true);
    // `checked` reflects nothing; this attribute is the only half a reset reads.
    expect(input.hasAttribute("checked")).toBe(true);
  });

  it("writes only the default when the box already agrees", () => {
    const form = build(`<input type="checkbox" />`);
    const input = form.querySelector("input")!;

    // The shape a watcher sees after a real toggle: the browser has already flipped the box, so
    // the state catching up leaves only the default to write.
    input.checked = true;

    setFormChecked(input, true);

    expect(input.checked).toBe(true);
    expect(input.hasAttribute("checked")).toBe(true);
  });

  it("puts the box back when the state declines the toggle", () => {
    const form = build(`<input type="checkbox" />`);
    const input = form.querySelector("input")!;

    input.checked = true;
    setFormChecked(input, false);

    expect(input.checked).toBe(false);
    expect(input.hasAttribute("checked")).toBe(false);
  });

  it("is what makes a reset put the box back", () => {
    const form = build(`<input type="checkbox" />`);
    const input = form.querySelector("input")!;

    setFormChecked(input, true);
    input.checked = false;

    form.reset();

    expect(input.checked).toBe(true);
  });

  it("leaves exactly one radio in a group checked", () => {
    const form = build(
      `<input name="g" type="radio" value="a" />
       <input name="g" type="radio" value="b" />
       <input name="g" type="radio" value="c" />`,
    );
    const radios = Array.from(form.querySelectorAll<HTMLInputElement>("input"));

    // Every radio settling its own default is all the group needs: no walk, and the browser
    // restores each one independently from the half written here.
    for (const radio of radios) setFormChecked(radio, radio.value === "b");

    radios[2]!.checked = true;
    form.reset();

    expect(radios.filter((radio) => radio.checked)).toEqual([radios[1]]);
  });

  it("takes a control that has not registered yet", () => {
    expect(() => {
      setFormChecked(null, true);
      setFormChecked(undefined, true);
    }).not.toThrow();
  });
});
