import MeterFill from "./meter-fill.vue";
import MeterOutput from "./meter-output.vue";
import MeterRoot from "./meter-root.vue";
import MeterTrack from "./meter-track.vue";

/* eslint-disable sort-keys, sort-keys-fix/sort-keys-fix */
export const Meter = Object.assign(MeterRoot, {
  Root: MeterRoot,
  Output: MeterOutput,
  Track: MeterTrack,
  Fill: MeterFill,
});
/* eslint-enable sort-keys, sort-keys-fix/sort-keys-fix */

export {MeterFill, MeterOutput, MeterRoot, MeterTrack};

export type {
  MeterFillProps,
  MeterOutputProps,
  MeterRootProps,
  MeterRootProps as MeterProps,
  MeterSlotProps,
  MeterTrackProps,
} from "./meter.types";

export {meterVariants} from "@heroui/styles";

export type {MeterVariants} from "@heroui/styles";
