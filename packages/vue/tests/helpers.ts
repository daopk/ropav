import {getQueriesForElement} from "@testing-library/dom";
import {createComponent, createVaporApp, defineVaporComponent} from "vue";

/** `VaporComponent` is not part of vue's public types, so it is read off the runtime. */
type VaporComponent = Parameters<typeof createComponent>[0];

export interface RenderVaporOptions {
  /** Props passed to the component. Read through getters, so refs stay reactive. */
  props?: Record<string, unknown>;
  /** Slot functions returning DOM nodes. */
  slots?: Record<string, () => Node>;
}

/**
 * Mount a vapor component into a detached container and return DOM queries for it.
 *
 * Vue Test Utils does not support vapor, so mounting is done by hand. The component
 * is wrapped in a root vapor component and instantiated via `createComponent`,
 * because `createVaporApp(Component, props)` cannot pass slots.
 */
export const renderVapor = (component: VaporComponent, options: RenderVaporOptions = {}) => {
  const {props = {}, slots = {}} = options;
  const container = document.createElement("div");

  document.body.appendChild(container);

  // Vapor props are getters — that is what preserves reactivity across updates.
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
