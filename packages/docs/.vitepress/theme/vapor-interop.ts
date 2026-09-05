import type { App, Plugin } from "vue";

import * as Vue from "vue";

/**
 * The namespace import is load-bearing and must not be rewritten to a named one.
 *
 * VitePress externalises `vue` in its SSR build, which resolves to the CJS entry, and that
 * build carries no Vapor exports - `@vue/runtime-vapor` ships an esm-bundler file only. A
 * named import is a link-time `SyntaxError` there, which no `import.meta.env.SSR` guard can
 * reach. A namespace import simply yields `undefined`, and the server never needs the
 * plugin: a `vapor` SFC compiled with `ssr: true` comes out as a plain component with an
 * inlined `ssrRender`.
 */
export const installVaporInterop = (app: App): void => {
  const plugin = (Vue as { vaporInteropPlugin?: Plugin }).vaporInteropPlugin;

  if (plugin) app.use(plugin);
};
