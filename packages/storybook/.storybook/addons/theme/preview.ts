import type { Preview } from "@storybook/vue3-vite";

import { DEFAULT_THEME, THEME_GLOBAL_TYPE_ID, THEME_OPTIONS } from "./constants";

export { THEME_GLOBAL_TYPE_ID };

export const themeGlobalType = {
  [THEME_GLOBAL_TYPE_ID]: {
    name: "Theme",
    description: "Ropav theme for components",
    defaultValue: DEFAULT_THEME,
    toolbar: {
      dynamicTitle: true,
      icon: "paintbrush",
      items: THEME_OPTIONS.map((option) => ({ value: option.value, title: option.title })),
    },
  },
} satisfies Preview["globalTypes"];
