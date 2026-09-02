import { createContext } from "../../utils/create-context";

/**
 * The application's router, reduced to the three questions a link has to ask it.
 *
 * Ported from React Aria's `packages/react-aria/src/utils/RouterProvider.tsx`
 * (react-aria 3.51.0), minus its `isNative` branch — this package has no native target.
 *
 * `resolveHref` is React's `useHref` renamed: in Vue a `use*` name promises a composable that
 * may only be called during `setup()`, and this one is a plain function called from a `computed`.
 */
export interface RouterContext {
  /**
   * Hands a same-origin, unmodified activation to the application's router.
   *
   * Receives the href as the link declared it, not as the anchor renders it — `resolveHref` is
   * for the DOM, and a router wants back the path it was given.
   */
  navigate: (href: string, options?: unknown) => void;
  /**
   * Whether this href addresses the route showing now.
   *
   * The matching rule lives entirely here, in the application's own predicate: exact against
   * prefix, trailing slashes and query handling all differ per route and per link, and a library
   * that guessed would be wrong for half of them.
   */
  isCurrent: (href: string) => boolean;
  /**
   * Turns an app-relative href into the URL the anchor should carry, for a router mounted under
   * a base path or running in hash mode. The rendered href is what a middle-click opens and what
   * "copy link address" yields, so it has to be the real one.
   */
  resolveHref: (href: string) => string;
}

/**
 * The router an ancestor has supplied, or `null` when nobody has and the browser's own navigation
 * is what should happen.
 *
 * Loose, because most of the tree runs without a router — a documentation page, a test, an app
 * that never routes — and following the href is the right answer there, not an error.
 */
export const [useRouterContext, provideRouterContext] = createContext<RouterContext | null>({
  defaultValue: null,
  name: "RouterContext",
  strict: false,
});
