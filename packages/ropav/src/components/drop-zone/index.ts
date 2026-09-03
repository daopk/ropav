import DropZoneRoot from "./drop-zone-root.vue";
import DropZoneTrigger from "./drop-zone-trigger.vue";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const DropZone = Object.assign(DropZoneRoot, {
  Root: DropZoneRoot,
  Trigger: DropZoneTrigger,
});

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export { DropZoneRoot, DropZoneTrigger };

export type {
  DropZoneRootProps,
  DropZoneRootProps as DropZoneProps,
  DropZoneSlotProps,
  DropZoneStatus,
  DropZoneTriggerProps,
} from "./drop-zone.types";

export { useDropZoneContext, provideDropZoneContext } from "./drop-zone.context";

export type { DropZoneContext } from "./drop-zone.context";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export { dropZoneVariants } from "@ropav/styles";

export type { DropZoneVariants } from "@ropav/styles";
