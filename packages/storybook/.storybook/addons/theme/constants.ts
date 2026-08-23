export const THEME_GLOBAL_TYPE_ID = "ropav-theme";

export const THEME_VALUES = ["light", "dark"] as const;
export type ThemeKey = (typeof THEME_VALUES)[number];

export const DEFAULT_THEME: ThemeKey = THEME_VALUES[0];

export interface ThemeOption {
  value: ThemeKey;
  title: string;
  description?: string;
}

export const THEME_OPTIONS: ThemeOption[] = [
  { value: "light", title: "Light", description: "Light theme" },
  { value: "dark", title: "Dark", description: "Dark theme" },
];

export const isThemeKey = (value: string | undefined | null): value is ThemeKey =>
  !!value && THEME_VALUES.includes(value as ThemeKey);

export const ensureThemeKey = (value: string | undefined | null): ThemeKey =>
  isThemeKey(value) ? value : DEFAULT_THEME;
