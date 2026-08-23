import type { AlertDialogPlacement, AlertDialogStatus } from "@/components/alert-dialog";
import type { AlertDialogVariants } from "@ropav/styles";

export interface AlertDialogFixtureProps {
  defaultOpen?: boolean;
  isDismissable?: boolean;
  isKeyboardDismissDisabled?: boolean;
  isOpen?: boolean;
  keepOpenFor?: string;
  placement?: AlertDialogPlacement;
  portalContainer?: string | HTMLElement;
  size?: AlertDialogVariants["size"];
  variant?: AlertDialogVariants["variant"];
  closeTriggerLabel?: string;
  iconStatus?: AlertDialogStatus;
  secondIconStatus?: AlertDialogStatus;
  withCloseTrigger?: boolean;
  withCloseWrapper?: boolean;
  withCustomIcon?: boolean;
  withCustomTrigger?: boolean;
  withIcon?: boolean;
  withInsideButton?: boolean;
  withSecondIcon?: boolean;
  withoutHeading?: boolean;
}
