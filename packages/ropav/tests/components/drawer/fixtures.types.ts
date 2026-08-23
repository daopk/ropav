import type { DrawerPlacement } from "@/components/drawer";
import type { DrawerVariants } from "@ropav/styles";

export interface DrawerFixtureProps {
  defaultOpen?: boolean;
  isDismissable?: boolean;
  isKeyboardDismissDisabled?: boolean;
  isOpen?: boolean;
  keepOpenFor?: string;
  placement?: DrawerPlacement;
  portalContainer?: string | HTMLElement;
  variant?: DrawerVariants["variant"];
  closeTriggerLabel?: string;
  withCloseTrigger?: boolean;
  withCloseWrapper?: boolean;
  withHandle?: boolean;
  withInsideButton?: boolean;
  withoutHeading?: boolean;
}
