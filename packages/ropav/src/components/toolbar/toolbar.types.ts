import type { ToolbarOrientation } from "../../composables/use-toolbar";

export interface ToolbarRootProps {
  class?: string;
  /** Lifts the controls onto a rounded, raised surface instead of leaving them bare. */
  isAttached?: boolean;
  /** Axis the controls are laid out along, which decides the arrow keys. @default "horizontal" */
  orientation?: ToolbarOrientation;
}
