import ProgressBarFill from "./progress-bar-fill.vue";
import ProgressBarOutput from "./progress-bar-output.vue";
import ProgressBarRoot from "./progress-bar-root.vue";
import ProgressBarTrack from "./progress-bar-track.vue";

/* eslint-disable sort-keys, sort-keys-fix/sort-keys-fix */
export const ProgressBar = Object.assign(ProgressBarRoot, {
  Root: ProgressBarRoot,
  Output: ProgressBarOutput,
  Track: ProgressBarTrack,
  Fill: ProgressBarFill,
});
/* eslint-enable sort-keys, sort-keys-fix/sort-keys-fix */

export {ProgressBarFill, ProgressBarOutput, ProgressBarRoot, ProgressBarTrack};

export type {
  ProgressBarFillProps,
  ProgressBarOutputProps,
  ProgressBarRootProps,
  ProgressBarRootProps as ProgressBarProps,
  ProgressBarSlotProps,
  ProgressBarTrackProps,
} from "./progress-bar.types";

export {progressBarVariants} from "@ropav/styles";

export type {ProgressBarVariants} from "@ropav/styles";
