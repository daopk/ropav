import ProgressBarFill from "./progress-bar-fill.vue";
import ProgressBarOutput from "./progress-bar-output.vue";
import ProgressBarRoot from "./progress-bar-root.vue";
import ProgressBarTrack from "./progress-bar-track.vue";

export const ProgressBar = Object.assign(ProgressBarRoot, {
  Fill: ProgressBarFill,
  Output: ProgressBarOutput,
  Root: ProgressBarRoot,
  Track: ProgressBarTrack,
});

export { ProgressBarFill, ProgressBarOutput, ProgressBarRoot, ProgressBarTrack };

export type {
  ProgressBarFillProps,
  ProgressBarOutputProps,
  ProgressBarRootProps,
  ProgressBarRootProps as ProgressBarProps,
  ProgressBarSlotProps,
  ProgressBarTrackProps,
} from "./progress-bar.types";

export { progressBarVariants } from "@ropav/styles";

export type { ProgressBarVariants } from "@ropav/styles";
