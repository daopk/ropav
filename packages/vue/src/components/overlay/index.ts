/**
 * The overlay layer every positioned overlay is built on: a popover, a tooltip's content, a
 * select's listbox. Internal on purpose — `@heroui/react` publishes no equivalent, so this
 * directory is listed in the build's skipped set and never becomes a subpath of its own.
 */
export {default as OverlayArrow} from "./overlay-arrow.vue";
export {default as OverlayDismissButton} from "./overlay-dismiss-button.vue";
export {default as OverlayPopover} from "./overlay-popover.vue";

export {createOverlaySlotContexts, provideOverlaySlotContexts} from "./overlay-slots";

export type {OverlaySlotContexts} from "./overlay-slots";

export type {OverlayArrowProps, OverlayPopoverProps} from "./overlay.types";

export {
  provideOverlayArrowContext,
  provideOverlayGroupContext,
  provideOverlayScopeContext,
  provideOverlayTargetContext,
  useOverlayArrowContext,
  useOverlayGroupContext,
  useOverlayScopeContext,
  useOverlayTargetContext,
} from "./overlay.context";

export type {
  OverlayArrowContext,
  OverlayGroupContext,
  OverlayScopeContext,
  OverlayTargetContext,
} from "./overlay.context";
