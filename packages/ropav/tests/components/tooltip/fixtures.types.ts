import type { Placement } from "@/utils/position";

export interface TooltipFixtureProps {
  closeDelay?: number;
  defaultOpen?: boolean;
  delay?: number;
  isDisabled?: boolean;
  isOpen?: boolean;
  placement?: Placement;
  shouldCloseOnPress?: boolean;
  shouldFlip?: boolean;
  shouldSkipAnimation?: boolean;
  showArrow?: boolean;
  trigger?: "hover" | "focus";
  withArrow?: boolean;
  withCustomArrow?: boolean;
  withCustomTrigger?: boolean;
}
