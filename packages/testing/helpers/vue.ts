import {getQueriesForElement} from "@testing-library/dom";
import {createComponent, createVaporApp, defineVaporComponent} from "vue";

/** `VaporComponent` is not part of vue's public types, so it is read off the runtime. */
type VaporComponent = Parameters<typeof createComponent>[0];

export interface RenderVaporOptions {
  /**
   * Props passed to the component. Each is wrapped in a getter, which is what keeps it
   * reactive — reading a `ref` inside the object makes DOM updates follow it with no
   * `rerender` step.
   */
  props?: Record<string, unknown>;
  /** Slot functions returning DOM nodes, e.g. `{default: () => document.createTextNode("x")}`. */
  slots?: Record<string, () => Node>;
}

export type RenderVaporResult = ReturnType<typeof renderVapor>;

/**
 * Mount a Vapor component into a container in the document and return DOM queries for it.
 *
 * Vue Test Utils has no Vapor support, and `@testing-library/vue` plus `vitest-browser-vue`
 * both build on it, so mounting is done by hand. Works unchanged in jsdom and in a real
 * browser.
 *
 * The component is wrapped in a root Vapor component and instantiated through
 * `createComponent` rather than mounted directly, because `createVaporApp(Component, props)`
 * has no way to pass slots.
 *
 * @example
 * ```ts
 * const {getByRole, unmount} = renderVapor(Button, {
 *   props: {variant: "danger"},
 *   slots: {default: () => document.createTextNode("Delete")},
 * });
 * ```
 */
export const renderVapor = (component: VaporComponent, options: RenderVaporOptions = {}) => {
  const {props = {}, slots = {}} = options;
  const container = document.createElement("div");

  document.body.appendChild(container);

  const rawProps: Record<string, () => unknown> = {};

  for (const key of Object.keys(props)) {
    rawProps[key] = () => props[key];
  }

  const Root = defineVaporComponent({
    setup: () => createComponent(component, rawProps, slots, true),
  });

  const app = createVaporApp(Root);

  app.mount(container);

  return {
    ...getQueriesForElement(container),
    app,
    container,
    unmount: () => {
      app.unmount();
      container.remove();
    },
  };
};

export {getQueriesForElement, waitFor, within} from "@testing-library/dom";
