import type { RouterContext } from "@/components/router-provider/router-provider.context";

export interface RouterProviderFixtureProps {
  navigate?: (href: string, options?: unknown) => void;
  isCurrent?: (href: string) => boolean;
  resolveHref?: (href: string) => string;
  /** Handed the router the content below resolved. */
  onReady?: (router: RouterContext | null) => void;
  /** Nests a second provider inside the first, to check which one the content finds. */
  innerNavigate?: (href: string, options?: unknown) => void;
}
