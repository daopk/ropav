export const THEME_GLOBAL_TYPE_ID = "ropav-theme";
export const SCHEME_GLOBAL_TYPE_ID = "ropav-scheme";

/**
 * The two axes are orthogonal: `data-theme` picks the palette, the `light`/`dark` class
 * picks the appearance. Every theme ships both, so a single list would have to enumerate every theme twice.
 *
 * This is also the only enumeration of the bundled themes outside `@ropav/styles` itself -
 * keep it in step with `packages/styles/scripts/themes/presets.ts`.
 */
export const THEME_VALUES = [
  "default",
  "hero",
  "sky",
  "lavender",
  "mint",
  "netflix",
  "uber",
  "spotify",
  "coinbase",
  "airbnb",
  "discord",
  "rabbit",
] as const;

export const SCHEME_VALUES = ["light", "dark"] as const;

export type ThemeKey = (typeof THEME_VALUES)[number];
export type SchemeKey = (typeof SCHEME_VALUES)[number];

export const DEFAULT_THEME: ThemeKey = THEME_VALUES[0];
export const DEFAULT_SCHEME: SchemeKey = SCHEME_VALUES[0];

export interface ThemeOption {
  value: ThemeKey;
  title: string;
}

export const THEME_OPTIONS: ThemeOption[] = [
  { value: "default", title: "Default" },
  { value: "hero", title: "Hero" },
  { value: "sky", title: "Sky" },
  { value: "lavender", title: "Lavender" },
  { value: "mint", title: "Mint" },
  { value: "netflix", title: "Netflix" },
  { value: "uber", title: "Uber" },
  { value: "spotify", title: "Spotify" },
  { value: "coinbase", title: "Coinbase" },
  { value: "airbnb", title: "Airbnb" },
  { value: "discord", title: "Discord" },
  { value: "rabbit", title: "Rabbit" },
];

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
