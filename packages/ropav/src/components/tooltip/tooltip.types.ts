import type {Placement} from "../../utils/position";

export interface TooltipRootProps {
  isOpen?: boolean;
  defaultOpen?: boolean;
  isDisabled?: boolean;
  /**
   * How long the pointer has to rest on the trigger before the tooltip opens.
   *
   * @default the `--tooltip-delay` custom property, or 1500
   */
  delay?: number;
  /**
   * How long the tooltip stays after the pointer leaves.
   *
   * @default the `--tooltip-close-delay` custom property, or 500
   */
  closeDelay?: number;
  /** Opens on hover and on keyboard focus, or on focus alone. @default "hover" */
  trigger?: "hover" | "focus";
  /** Whether pressing the trigger closes the tooltip. @default true */
  shouldCloseOnPress?: boolean;
  /**
   * Whether a tooltip replacing another one appears without an animation.
   *
   * Off by default, which is a deliberate difference from React Aria: it skips both animations
   * while its shared warmup timer is running, whereas here the fade is driven from the stylesheet
   * and is what makes a swap read as one label moving rather than two flashing.
   *
   * @default false
   */
  shouldSkipAnimation?: boolean;
}

export interface TooltipRootEmits {
  openChange: [isOpen: boolean];
  "update:isOpen": [isOpen: boolean];
}

export interface TooltipTriggerProps {
  class?: string;
}

export interface TooltipContentProps {
  class?: string;
  /** Where the tooltip sits relative to its trigger. @default "top" */
  placement?: Placement;
  /**
   * Distance along the main axis, between the tooltip and its trigger.
   *
   * @default 7 with an arrow, 3 without
   */
  offset?: number;
  /** Distance along the cross axis. @default 0 */
  crossOffset?: number;
  /** Whether the tooltip may flip to the other side when it does not fit. @default true */
  shouldFlip?: boolean;
  /** Distance kept between the tooltip and the edge of the viewport. @default 12 */
  containerPadding?: number;
  /** Distance kept between the arrow and the corner of the tooltip. @default 0 */
  arrowBoundaryOffset?: number;
  /**
   * Whether the tooltip leaves room for an arrow.
   *
   * Only the offset: the arrow itself is rendered by `Tooltip.Arrow`, so setting this without one
   * simply spaces the tooltip further from its trigger.
   *
   * @default false
   */
  showArrow?: boolean;
  /** Where the tooltip is rendered. @default document.body */
  portalContainer?: string | HTMLElement;
  /** Forces the entry state, for a caller driving the animation itself. */
  isEntering?: boolean;
  /** Forces the exit state. */
  isExiting?: boolean;
}

export interface TooltipArrowProps {
  class?: string;
}
