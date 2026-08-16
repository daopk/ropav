import ProgressCircleFillCircle from "./progress-circle-fill-circle.vue";
import ProgressCircleRoot from "./progress-circle-root.vue";
import ProgressCircleTrackCircle from "./progress-circle-track-circle.vue";
import ProgressCircleTrack from "./progress-circle-track.vue";

/* eslint-disable sort-keys, sort-keys-fix/sort-keys-fix */
export const ProgressCircle = Object.assign(ProgressCircleRoot, {
  Root: ProgressCircleRoot,
  Track: ProgressCircleTrack,
  TrackCircle: ProgressCircleTrackCircle,
  FillCircle: ProgressCircleFillCircle,
});
/* eslint-enable sort-keys, sort-keys-fix/sort-keys-fix */

export {
  ProgressCircleFillCircle,
  ProgressCircleRoot,
  ProgressCircleTrack,
  ProgressCircleTrackCircle,
};

export type {
  ProgressCircleFillCircleProps,
  ProgressCircleRootProps,
  ProgressCircleRootProps as ProgressCircleProps,
  ProgressCircleSlotProps,
  ProgressCircleTrackCircleProps,
  ProgressCircleTrackProps,
} from "./progress-circle.types";

export {progressCircleVariants} from "@heroui/styles";

export type {ProgressCircleVariants} from "@heroui/styles";
