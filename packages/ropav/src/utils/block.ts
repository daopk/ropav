import type { Block } from "vue";

import * as Vue from "vue";

/**
 * The namespace import is load-bearing and must not be rewritten to a named one.
 *
 * `isFragment` and `isVaporComponent` come from the Vapor runtime, which only the esm-bundler
 * build re-exports. A bundler externalising `vue` for SSR resolves the node entry, and a named
 * import of a binding it does not have is a link-time `SyntaxError` — thrown before any guard
 * could run. A namespace read simply yields `undefined`, which is all this file needs: every
 * function below is reached from a Vapor render, and a server has none.
 */
const { isFragment, isVaporComponent } = Vue;

/**
 * The DOM nodes a Vapor block resolves to, in document order.
 *
 * A slot function hands back a block rather than a node: a single node for one child, an
 * array for several, a component instance, or a fragment when the content sits behind
 * `v-if` or is forwarded through another `<slot>`. Flattening it gives the one thing a
 * caller can actually ask questions about.
 *
 * Everything read here is already rendered by the time the block is returned, so this
 * inspects the result of a render rather than causing one.
 */
export const flattenBlock = (block: Block | undefined | null): Node[] => {
  if (block == null) return [];
  if (Array.isArray(block)) return block.flatMap(flattenBlock);
  if (isFragment(block)) return flattenBlock(block.nodes);
  if (isVaporComponent(block)) return flattenBlock(block.block);

  return [block];
};

/**
 * Whether a block is nothing but text — the Vapor equivalent of React's
 * `typeof children === "string" || typeof children === "number"`.
 *
 * Empty counts as false: a component asking this is deciding whether to wrap the content,
 * and there is nothing to wrap.
 */
export const isTextOnlyBlock = (nodes: Node[]): boolean =>
  nodes.length > 0 && nodes.every((node) => node.nodeType === Node.TEXT_NODE);
