import type { RouterContext } from "@/components/router-provider/router-provider.context";

export interface RouterHostProps {
  /** Handed the router the content here resolved, or `null` where no provider supplied one. */
  onReady?: (router: RouterContext | null) => void;
}
