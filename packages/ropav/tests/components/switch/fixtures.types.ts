import type {SwitchRootProps} from "@/components/switch";

export interface SwitchFixtureProps extends SwitchRootProps {
  /** Renders help text as a sibling of the clickable content. */
  withDescription?: boolean;
  /** Renders a custom icon inside the thumb. */
  withIcon?: boolean;
  /** Renders a `FieldError` as a sibling of the clickable content. */
  withFieldError?: boolean;
  /** Words the error itself instead of showing what validation produced. */
  withCustomError?: boolean;
}
