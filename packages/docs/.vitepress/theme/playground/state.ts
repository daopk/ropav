import type { PlaygroundSpec, PlaygroundState } from "../../playgrounds/types.ts";

/** The same value on the server and in the browser, so the markup hydrates. */
export const defaultState = (spec: PlaygroundSpec): PlaygroundState =>
  Object.fromEntries(spec.controls.map((control) => [control.name, control.defaultValue]));
