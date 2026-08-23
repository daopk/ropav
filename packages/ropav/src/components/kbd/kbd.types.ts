import type { KbdKey } from "./kbd.constants";
import type { KbdVariants } from "@ropav/styles";

export interface KbdRootProps {
  class?: string;
  /** Visual variant. */
  variant?: KbdVariants["variant"];
}

export interface KbdAbbrProps {
  class?: string;
  /** The modifier to render, as its symbol plus a spelled-out title. */
  keyValue: KbdKey;
}

export interface KbdContentProps {
  class?: string;
}
