import type {ModalPlacement} from "@/components/modal";
import type {ModalVariants} from "@heroui/styles";

export interface ModalFixtureProps {
  defaultOpen?: boolean;
  isDismissable?: boolean;
  isKeyboardDismissDisabled?: boolean;
  isOpen?: boolean;
  keepOpenFor?: string;
  placement?: ModalPlacement;
  portalContainer?: string | HTMLElement;
  scroll?: ModalVariants["scroll"];
  size?: ModalVariants["size"];
  variant?: ModalVariants["variant"];
  withCustomTrigger?: boolean;
  withInsideButton?: boolean;
}
