import type { Portal } from "@/composables/use-portal";
import type { VaporComponent } from "vue";

import { renderVapor } from "@ropav/testing/helpers/vue";
import { describe, expect, it } from "vitest";
import { createApp, createComponent, defineVaporComponent, ref } from "vue";

import { providePortal, usePortal } from "@/composables/use-portal";

/** `leaf` below a chain of ancestors, each running one `provide` in its own setup. */
const nest = (provides: (() => void)[], leaf: VaporComponent): VaporComponent => {
  const [provide, ...rest] = provides;

  if (!provide) return leaf;

  return defineVaporComponent({
    setup: () => {
      provide();

      return createComponent(nest(rest, leaf));
    },
  });
};

/**
 * The portal a component sees below a chain of providers, outermost first. One component per
 * level, because a component never injects what it provides itself.
 */
const below = (...provides: (() => void)[]): Portal => {
  let portal: Portal | undefined;
  const leaf = defineVaporComponent({
    setup: () => {
      portal = usePortal();

      return [];
    },
  });

  renderVapor(nest(provides, leaf)).unmount();

  if (!portal) throw new Error("the child never ran");

  return portal;
};

describe("usePortal", () => {
  it("is the body, the whole document, without a provider", () => {
    const portal = createApp({}).runWithContext(usePortal);

    expect(portal.container.value).toBe("body");
    expect(portal.root.value).toBeNull();
    expect(portal.isContained.value).toBe(false);
  });

  it("follows the nearest provider's container and root", () => {
    const container = ref<HTMLElement | null>(document.createElement("div"));
    const root = document.createElement("section");
    const portal = below(() => providePortal({ container, root }));

    expect(portal.container.value).toBe(container.value);
    expect(portal.root.value).toBe(root);
    expect(portal.isContained.value).toBe(true);

    container.value = null;

    expect(portal.container.value).toBe("body");
    expect(portal.isContained.value).toBe(false);
  });

  it("counts the body named as an element as not contained", () => {
    const portal = below(() => providePortal({ container: document.body }));

    expect(portal.isContained.value).toBe(false);
  });

  it("inherits what a nested provider leaves out, and resets on null", () => {
    const outer = document.createElement("div");
    const inner = document.createElement("div");
    const root = document.createElement("section");
    const enclosing = () => providePortal({ container: outer, root });

    const inherited = below(enclosing, () => providePortal({ container: inner }));
    const reset = below(enclosing, () => providePortal({ container: null, root: null }));

    // React Aria's rule: absent keeps the enclosing provider's choice, `null` goes back to the page.
    expect(inherited.container.value).toBe(inner);
    expect(inherited.root.value).toBe(root);
    expect(reset.container.value).toBe("body");
    expect(reset.root.value).toBeNull();
  });
});
