import type { ThemeId } from "@ropav/styles";

import { themeIds, themeLabels } from "@ropav/styles";

export const THEME_GLOBAL_TYPE_ID = "ropav-theme";
export const SCHEME_GLOBAL_TYPE_ID = "ropav-scheme";

/**
 * The two axes are orthogonal: `data-theme` picks the palette, the `light`/`dark` class
 * picks the appearance. Every theme ships both, so a single list would have to enumerate every theme twice.
 *
 * The palette axis comes from `@ropav/styles`, which generates it from the same presets the
 * stylesheets are built from - this file used to restate it, and a second consumer would have
 * made a third copy. The appearance axis is Storybook's own and stays here.
 */
export const THEME_VALUES = themeIds;

export const SCHEME_VALUES = ["light", "dark"] as const;

export type ThemeKey = ThemeId;
export type SchemeKey = (typeof SCHEME_VALUES)[number];

export const DEFAULT_THEME: ThemeKey = THEME_VALUES[0];
export const DEFAULT_SCHEME: SchemeKey = SCHEME_VALUES[0];

export interface ThemeOption {
  value: ThemeKey;
  title: string;
}

export const THEME_OPTIONS: ThemeOption[] = THEME_VALUES.map((value) => ({
  value,
  title: themeLabels[value],
}));

export interface SchemeOption {
  value: SchemeKey;
  title: string;
  description?: string;
}

export const SCHEME_OPTIONS: SchemeOption[] = [
  { value: "light", title: "Light", description: "Light appearance" },
  { value: "dark", title: "Dark", description: "Dark appearance" },
];

export const isThemeKey = (value: string | undefined | null): value is ThemeKey =>
  !!value && THEME_VALUES.includes(value as ThemeKey);

export const ensureThemeKey = (value: string | undefined | null): ThemeKey =>
  isThemeKey(value) ? value : DEFAULT_THEME;

export const isSchemeKey = (value: string | undefined | null): value is SchemeKey =>
  !!value && SCHEME_VALUES.includes(value as SchemeKey);

export const ensureSchemeKey = (value: string | undefined | null): SchemeKey =>
  isSchemeKey(value) ? value : DEFAULT_SCHEME;
