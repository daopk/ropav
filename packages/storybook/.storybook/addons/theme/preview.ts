import type { Preview } from "@storybook/vue3-vite";

import {
  DEFAULT_SCHEME,
  DEFAULT_THEME,
  SCHEME_GLOBAL_TYPE_ID,
  SCHEME_OPTIONS,
  THEME_GLOBAL_TYPE_ID,
  THEME_OPTIONS,
} from "./constants";

export { SCHEME_GLOBAL_TYPE_ID, THEME_GLOBAL_TYPE_ID };

/** Two toolbar entries, because palette and appearance are independent. */
export const themeGlobalType = {
  [THEME_GLOBAL_TYPE_ID]: {
    name: "Theme",
    description: "Ropav colour theme",
    defaultValue: DEFAULT_THEME,
    toolbar: {
      dynamicTitle: true,
      icon: "paintbrush",
      items: THEME_OPTIONS.map((option) => ({ value: option.value, title: option.title })),
    },
  },
  [SCHEME_GLOBAL_TYPE_ID]: {
    name: "Appearance",
    description: "Light or dark",
    defaultValue: DEFAULT_SCHEME,
    toolbar: {
      dynamicTitle: true,
      icon: "contrast",
      items: SCHEME_OPTIONS.map((option) => ({ value: option.value, title: option.title })),
    },
  },
} satisfies Preview["globalTypes"];
