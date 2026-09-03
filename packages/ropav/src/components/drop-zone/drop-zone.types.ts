/** What the zone makes of the drag currently over it. */
export type DropZoneStatus = "accept" | "idle" | "reject";

export interface DropZoneRootProps {
  class?: string;
  /**
   * Which files to take, spelled the way the native `accept` attribute spells it: a comma
   * separated list of mime types, `type/*` wildcards and `.ext` suffixes.
   *
   * It filters the picker, judges a drag while it is still moving, and filters what a drop
   * emits. A drag is only refused where the refusal is certain — see `drop-zone-root.vue`.
   */
  accept?: string;
  /** Whether more than one file may arrive at once. */
  multiple?: boolean;
  isDisabled?: boolean;
  ariaLabel?: string;
  ariaLabelledby?: string;
  ariaDescribedby?: string;
}

export interface DropZoneSlotProps {
  status: DropZoneStatus;
  /** Whether a drag the zone would take is over it. */
  isDropTarget: boolean;
  isDisabled: boolean;
  /** Opens the file picker, as clicking the zone does. */
  open: () => void;
}

export interface DropZoneTriggerProps {
  class?: string;
}
