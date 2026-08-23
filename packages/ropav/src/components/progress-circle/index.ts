import ProgressCircleFillCircle from "./progress-circle-fill-circle.vue";
import ProgressCircleRoot from "./progress-circle-root.vue";
import ProgressCircleTrackCircle from "./progress-circle-track-circle.vue";
import ProgressCircleTrack from "./progress-circle-track.vue";

export const ProgressCircle = Object.assign(ProgressCircleRoot, {
  FillCircle: ProgressCircleFillCircle,
  Root: ProgressCircleRoot,
  Track: ProgressCircleTrack,
  TrackCircle: ProgressCircleTrackCircle,
});

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

export { progressCircleVariants } from "@ropav/styles";

export type { ProgressCircleVariants } from "@ropav/styles";
