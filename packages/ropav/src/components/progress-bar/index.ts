import ProgressBarFill from "./progress-bar-fill.vue";
import ProgressBarOutput from "./progress-bar-output.vue";
import ProgressBarRoot from "./progress-bar-root.vue";
import ProgressBarTrack from "./progress-bar-track.vue";

export { ProgressBarFill, ProgressBarOutput, ProgressBarRoot as ProgressBar, ProgressBarTrack };

export type {
  ProgressBarFillProps,
  ProgressBarOutputProps,
  ProgressBarRootProps as ProgressBarProps,
  ProgressBarSlotProps,
  ProgressBarTrackProps,
} from "./progress-bar.types";

export { progressBarVariants } from "@ropav/styles";

export type { ProgressBarVariants } from "@ropav/styles";
