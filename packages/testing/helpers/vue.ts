import type { Component, VNodeChild } from "vue";

import { getQueriesForElement } from "@testing-library/dom";
import {
  createApp,
  createComponent,
  createVaporApp,
  defineVaporComponent,
  h,
  vaporInteropPlugin,
} from "vue";

/** `VaporComponent` is not part of vue's public types, so it is read off the runtime. */
type VaporComponent = Parameters<typeof createComponent>[0];

export interface RenderVaporOptions {
  /**
   * Props passed to the component. Each is wrapped in a getter, which is what keeps it
   * reactive — reading a `ref` inside the object makes DOM updates follow it with no
   * `rerender` step.
   */
  props?: Record<string, unknown>;
  /**
   * Slot functions returning DOM nodes, e.g. `{default: () => document.createTextNode("x")}`.
   * Any slot props the component passes arrive as the first argument.
   */
  slots?: Record<string, (slotProps?: Record<string, unknown>) => Node>;
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
 * The returned queries are scoped to the container, which cannot see content a component
 * teleports elsewhere — everything an overlay renders lands outside it. `screen` covers the
 * whole document for those cases, and `baseElement` is there to scope a query by hand.
 *
 * @example
 * ```ts
 * const {getByRole, unmount} = renderVapor(Button, {
 *   props: {variant: "danger"},
 *   slots: {default: () => document.createTextNode("Delete")},
 * });
 * ```
 *
 * @example
 * ```ts
 * // An overlay teleports to the body, so its content is only reachable through `screen`.
 * const {screen, unmount} = renderVapor(Dropdown);
 * const menu = screen.getByRole("menu");
 * ```
 */
export const renderVapor = (component: VaporComponent, options: RenderVaporOptions = {}) => {
  const { props = {}, slots = {} } = options;
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
    /** The element the whole document is queried from, for scoping a query by hand. */
    baseElement: document.body,
    container,
    /** Document-wide queries, so a teleported overlay is reachable. */
    screen: getQueriesForElement(document.body),
    unmount: () => {
      app.unmount();
      container.remove();
    },
  };
};

export interface RenderInteropOptions {
  props?: Record<string, unknown>;
  /** Slot functions returning vnodes. Any slot props the component passes arrive as the argument. */
  slots?: Record<string, (slotProps?: Record<string, unknown>) => VNodeChild>;
}

export type RenderInteropResult = ReturnType<typeof renderInterop>;

/**
 * Mount a Vapor component from a **VDOM** host, with its slot content authored in the host.
 *
 * A different shape from `renderVapor` rather than a convenience over it, and the difference is
 * the point: content authored in a VDOM host and forwarded through a Vapor component's slot
 * resolves `inject` against the host's tree, so a `provide` made deeper in the Vapor tree is never
 * found. Content authored in Vapor resolves against the component that renders it and does find it.
 *
 * Anything a component provides *for* its content therefore has to be proven here as well.
 * `renderVapor` cannot fail on it, so a component can be green in every Vapor test while being
 * broken in every host that mounts it the ordinary way.
 *
 * The host builds its tree with `h` rather than a template, because the vapor runtime bundle the
 * tests alias `vue` to carries no template compiler.
 *
 * @example
 * ```ts
 * const {screen, unmount} = renderInterop(PopoverRoot, {
 *   slots: {default: () => [h(PopoverContent, null, {default: () => h(ButtonRoot)})]},
 * });
 * ```
 */
export const renderInterop = (component: Component, options: RenderInteropOptions = {}) => {
  const { props = {}, slots = {} } = options;
  const container = document.createElement("div");

  document.body.appendChild(container);

  const app = createApp({ render: () => h(component, props, slots) });

  app.use(vaporInteropPlugin);
  app.mount(container);

  return {
    ...getQueriesForElement(container),
    app,
    /** The element the whole document is queried from, for scoping a query by hand. */
    baseElement: document.body,
    container,
    /** Document-wide queries, so a teleported overlay is reachable. */
    screen: getQueriesForElement(document.body),
    unmount: () => {
      app.unmount();
      container.remove();
    },
  };
};

export { getQueriesForElement, waitFor, within } from "@testing-library/dom";
