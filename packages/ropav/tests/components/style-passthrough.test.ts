import { renderVapor } from "@ropav/testing/helpers/vue";
import { afterEach, describe, expect, it } from "vitest";
import { nextTick, ref } from "vue";

import { Button } from "@/components/button";
import { Sidebar } from "@/components/sidebar";

/**
 * A `style` handed to a component reaches its root element, and stays there.
 *
 * The second clause is the one worth a test. A component that binds `:style` to a computed which
 * is sometimes `undefined` is not saying "no style of my own" — Vue patches that attribute, and
 * `undefined` on the binding takes the whole attribute off the element. Whatever the caller passed
 * goes with it, at whatever moment the component's own value happens to become undefined, which is
 * not a moment the caller can see coming.
 *
 * `Sidebar` is the case: it names `--sidebar-width` only once someone has set a width, so an
 * untouched sidebar is sized by the stylesheet rather than by a value restated in the markup.
 */

afterEach(() => {
  document.body.replaceChildren();
  localStorage.clear();
});

const root = (container: HTMLElement, slot: string) =>
  container.querySelector<HTMLElement>(`[data-slot='${slot}']`)!;

const text = (value: string) => () => document.createTextNode(value);

describe("a style passed to a component", () => {
  it("reaches the root of one that declares no style of its own", () => {
    const { container } = renderVapor(Button, {
      props: { style: "margin-top: 3px" },
      slots: { default: text("Save") },
    });

    expect(root(container, "button").style.marginTop).toBe("3px");
  });

  it("reaches the root of one that has a style, and sits beside it", () => {
    const { container } = renderVapor(Sidebar, {
      props: { defaultWidth: "240px", style: "margin-top: 3px" },
      slots: { default: text("") },
    });
    const element = root(container, "sidebar");

    expect(element.style.marginTop).toBe("3px");
    expect(element.style.getPropertyValue("--sidebar-width")).toBe("240px");
  });

  it("reaches it when the component's own style is undefined", () => {
    const { container } = renderVapor(Sidebar, {
      props: { style: "margin-top: 3px" },
      slots: { default: text("") },
    });

    expect(root(container, "sidebar").style.marginTop).toBe("3px");
  });

  it("is still there after the component's own style goes away", async () => {
    const width = ref<string | undefined>("240px");
    const { container } = renderVapor(Sidebar, {
      props: {
        style: "margin-top: 3px",
        get width() {
          return width.value;
        },
      },
      slots: { default: text("") },
    });
    const element = root(container, "sidebar");

    expect(element.style.getPropertyValue("--sidebar-width")).toBe("240px");

    width.value = undefined;
    await nextTick();

    expect(element.style.getPropertyValue("--sidebar-width")).toBe("");
    expect(element.style.marginTop).toBe("3px");
  });
});
