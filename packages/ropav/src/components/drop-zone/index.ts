import DropZoneRoot from "./drop-zone-root.vue";
import DropZoneTrigger from "./drop-zone-trigger.vue";

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export { DropZoneRoot as DropZone, DropZoneTrigger };

export type {
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
