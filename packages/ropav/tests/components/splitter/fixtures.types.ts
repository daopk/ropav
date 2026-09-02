import type { SplitterSize } from "@/components/splitter";

/*
 * Declared out here rather than in the SFC: a type a `defineProps` generic names is part of the
 * component's exported shape, and `vue-tsc` refuses to emit one that is private to the file.
 */
export interface SplitterFixturePanel {
  id: string;
  collapsedSize?: SplitterSize;
  defaultSize?: SplitterSize;
  isCollapsible?: boolean;
  maxSize?: SplitterSize;
  minSize?: SplitterSize;
}
