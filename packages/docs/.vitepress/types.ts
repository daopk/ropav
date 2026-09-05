export interface ApiEvent {
  name: string;
  /** What the handler receives, with the parameter names stripped. */
  payload: string;
}

export interface ApiPart {
  events: readonly ApiEvent[];
  /** The name the package exports it under, not the file's. */
  name: string;
  props: readonly ApiProp[];
  slots: readonly ApiSlot[];
}

export interface ApiProp {
  /** As written, so `"md"` keeps its quotes and a prose `@default` keeps its words. */
  default?: string;
  description: string;
  name: string;
  required: boolean;
  type: string;
}

export interface ApiSlot {
  name: string;
  props: readonly ApiSlotProp[];
}

export interface ApiSlotProp {
  name: string;
  type: string;
}

export interface StoryEntry {
  /** `Feedback`, or `""` for one filed directly under `Components`. */
  category: string;
  /** The library's own directory, which is also the slug of a page under `/components/`. */
  dir: string;
  /** Whether that page exists, so the list links to it rather than out to Storybook. */
  hasPage: boolean;
  /** The docs entry Storybook builds for the file. */
  id: string;
  name: string;
  title: string;
}
