import type { Component, VaporComponent } from "vue";

import * as Vue from "vue";

import { flattenBlock, isTextOnlyBlock } from "./block";

/**
 * The namespace import is load-bearing and must not be rewritten to a named one.
 *
 * `createComponent` and `defineVaporComponent` come from the Vapor runtime, which only the
 * esm-bundler build re-exports. A bundler externalising `vue` for SSR resolves the node entry,
 * and a named import of a binding it does not have is a link-time `SyntaxError` - thrown before
 * any guard could run, so no `import.meta.env.SSR` branch can reach it. A namespace read yields
 * `undefined` instead, which is what lets the two branches below be chosen at module scope.
 */
const { createComponent, defineComponent, defineVaporComponent } = Vue;

/**
 * A component that renders its children, wrapping them in `Label` when they are only text - the
 * equivalent of React's `typeof children === "string" || typeof children === "number"`.
 *
 * Written as a factory rather than an SFC because only a hand-written `setup` gets to hold the
 * children; an SFC's `<slot />` is inserted before there is anywhere to intervene. That costs it
 * the dual compilation a `.vue` file gets, so both branches are spelled out here and picked once,
 * on whether this bundle has a Vapor runtime at all.
 *
 * **Vapor.** The slot has already rendered by the time it returns its block, so inspecting that
 * block preserves its effects and lets the exact same text nodes move into the label. It is
 * called once and the very block it returns is what gets inserted, so nothing renders twice and
 * no effect is registered and thrown away - the actual hazard with slots in Vapor, rather than
 * reading them at all. A slot forwarded from a VDOM host is the exception: it is filled only on
 * insertion, so there is nothing to inspect and bare text goes unwrapped.
 *
 * **Server.** Renders the children and leaves them alone. A server cannot tell whether the
 * browser will hydrate this as Vapor or as VDOM, and wrapping guesses at one of them; passing
 * through matches a VDOM caller exactly, and matches a Vapor caller for every form in which the
 * label is written out - which is every documented one. The case it gives up is a Vapor caller
 * handing it bare text, and that is where a server-side wrap would have to come back.
 */
export const createAutoLabel = (Label: Component, name: string): Component =>
  defineVaporComponent
    ? defineVaporComponent(
        (_props, { slots }) => {
          const block = slots["default"]?.();

          if (block === undefined || !isTextOnlyBlock(flattenBlock(block))) return block ?? [];

          // A `vapor` SFC is typed as an ordinary component but is a Vapor one at runtime.
          return createComponent(Label as VaporComponent, null, { default: () => block });
        },
        { name },
      )
    : defineComponent({
        name,
        setup:
          (_props, { slots }) =>
          () => {
            const vnodes = slots["default"]?.();

            /*
             * Handing back the slot's own vnode rather than the array around it. An array
             * return is nested in a second fragment, and the extra anchor comments that leaves
             * in the markup are a mismatch of their own.
             */
            return vnodes !== undefined && vnodes.length === 1 ? vnodes[0] : vnodes;
          },
      });
