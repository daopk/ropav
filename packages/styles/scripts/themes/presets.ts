/**
 * Theme presets.
 *
 * Ported from HeroUI v3's theme builder (`apps/docs/src/app/[lang]/themes/theme-values.ts`
 * and `constants.ts`). `fontFamily` is dropped — Ropav does not own the font stack.
 *
 * Build-time only. Run `pnpm generate:themes` after editing.
 */

import type { SemanticOverrides } from "./color";

/** Radius steps, smallest to largest. */
/** Smallest to largest: none, extra-small, small, medium, large, extra-large. */
export const radiusCssMap = {
  "extra-large": "1rem",
  "extra-small": "0.125rem",
  large: "0.75rem",
  medium: "0.5rem",
  none: "0",
  small: "0.25rem",
} as const;

export type RadiusId = keyof typeof radiusCssMap;

/**
 * `--field-shadow` for a preset that does not override it — the elevation form controls have
 * carried since the port.
 *
 * Dark is a transparent placeholder rather than `none`: every ring in the library is a
 * `box-shadow`, so the slot has to stay occupied for the ring utilities to compose into it.
 */
export const fieldShadowCss = {
  dark: "0 0 0 0 transparent inset",
  light:
    "0 2px 4px 0 rgba(0, 0, 0, 0.04), 0 1px 2px 0 rgba(0, 0, 0, 0.06), 0 0 1px 0 rgba(0, 0, 0, 0.06)",
} as const;

export interface ThemePreset {
  /** Human-readable name, used in the generated file header and in docs. */
  label: string;
  /** Chroma of the neutral ramp — how much the greys are tinted toward `hue`. */
  base: number;
  /** Chroma of the accent colour. */
  chroma: number;
  /** Hue driving the accent, the neutral tint, and the semantic hue blend. */
  hue: number;
  /** Lightness of the accent colour. */
  lightness: number;
  /** `--radius`. */
  radius: RadiusId;
  /** `--field-radius`, for form controls. */
  formRadius: RadiusId;
  /** `--field-shadow`, per scheme. Omit for `fieldShadowCss`. */
  fieldShadow?: { light: string; dark: string };
  /** Exact semantic colours, where a brand's own palette beats the calculated one. */
  semanticOverrides?: SemanticOverrides;
}

// Neutral-ramp chroma presets, named after their position in the HeroUI builder's slider.
const BASE_DEFAULT = 0.0015;
const BASE_FULL_LEFT = 0;
const BASE_10P_LEFT = 0.002;
const BASE_50P = 0.01;

/**
 * Keyed alphabetically because the linter insists; `themeIds` below carries the order
 * themes are actually presented in.
 */
export const presets = {
  airbnb: {
    base: BASE_FULL_LEFT,
    chroma: 0.2309,
    formRadius: "large",
    hue: 17.07,
    label: "Airbnb",
    lightness: 0.6579,
    radius: "medium",
    semanticOverrides: {
      dark: {
        accentForeground: "oklch(0.9911 0 0)", // white
        danger: { color: "oklch(0.5392 0.1816 33.72)", foreground: "oklch(0.9911 0 0)" }, // #C13515
        success: { color: "oklch(0.652 0.114864 185.0749)", foreground: "oklch(0.9911 0 0)" }, // #00A699
        warning: { color: "oklch(0.8197 0.170602 78.4658)" }, // #FFB400
      },
      light: {
        accentForeground: "oklch(0.9911 0 0)", // white
        danger: { color: "oklch(0.5392 0.1816 33.72)", foreground: "oklch(0.9911 0 0)" }, // #C13515
        success: { color: "oklch(0.5573 0.0947 199.48)", foreground: "oklch(0.9911 0 0)" }, // #008489
        warning: { color: "oklch(0.6904 0.1972 38.75)", foreground: "oklch(0.9911 0 0)" }, // #FC642D
      },
    },
  },

  coinbase: {
    base: BASE_10P_LEFT,
    chroma: 0.2628,
    formRadius: "extra-small",
    hue: 262.87,
    label: "Coinbase",
    lightness: 0.5282,
    radius: "medium",
    semanticOverrides: {
      dark: {
        danger: { color: "oklch(0.6545 0.2145 22.31)" }, // #F84550
        success: { color: "oklch(0.7574 0.180554 156.931)" }, // #00D180
        warning: { color: "oklch(0.8095 0.1119 61.69)" }, // #F5B073
      },
      light: {
        danger: { color: "oklch(0.5507 0.2062 24)" }, // #CF202F
        success: { color: "oklch(0.5438 0.1268 157.17)" }, // #098551
        warning: { color: "oklch(0.8095 0.1119 61.69)" }, // #F5B073
      },
    },
  },

  default: {
    base: BASE_DEFAULT,
    chroma: 0.195,
    // The hand-written file halves this to 0.375rem, which the named scale cannot express.
    formRadius: "large",
    hue: 253.83,
    label: "Default",
    lightness: 0.6204,
    radius: "medium",
  },

  discord: {
    base: BASE_50P,
    chroma: 0.2091,
    formRadius: "large",
    hue: 273.85,
    label: "Discord",
    lightness: 0.5774,
    radius: "small",
    semanticOverrides: {
      dark: {
        danger: { color: "oklch(0.6318 0.2075 24.57)" }, // #ED4245
        success: { color: "oklch(0.8548 0.1967 150.16)" }, // #57F287
        warning: { color: "oklch(0.9218 0.1571 99.87)" }, // #FEE75C
      },
      light: {
        danger: { color: "oklch(0.5884 0.1993 24.39)" }, // #DA373C
        success: { color: "oklch(0.532 0.1238 151.57)" }, // #248046
        warning: { color: "oklch(0.9218 0.1571 99.87)" }, // #FEE75C
      },
    },
  },

  /**
   * Hand-written like `default`, and for the same reason — see `themes/hero.css`. This entry
   * carries the label, the presentation order and the radii only.
   */
  hero: {
    base: BASE_DEFAULT,
    chroma: 0.195,
    formRadius: "large",
    hue: 253.83,
    label: "Hero",
    lightness: 0.6204,
    radius: "medium",
  },

  lavender: {
    base: BASE_DEFAULT,
    chroma: 0.13,
    formRadius: "large",
    hue: 305,
    label: "Lavender",
    lightness: 0.77,
    radius: "medium",
  },

  mint: {
    base: BASE_DEFAULT,
    chroma: 0.12,
    formRadius: "large",
    hue: 155,
    label: "Mint",
    lightness: 0.82,
    radius: "medium",
  },

  netflix: {
    base: BASE_FULL_LEFT,
    chroma: 0.2349,
    formRadius: "extra-small",
    hue: 27.99,
    label: "Netflix",
    lightness: 0.5814,
    radius: "extra-small",
    semanticOverrides: {
      dark: {
        danger: { color: "oklch(0.4964 0.1994 28.56)" }, // #B9090B
        success: { color: "oklch(0.7677 0.1899 148.1)" }, // #46D369
        warning: { color: "oklch(0.8239 0.153 74.6)" }, // #FFB53F
      },
      light: {
        danger: { color: "oklch(0.4823 0.1938 27.64)" }, // #B20710
        success: { color: "oklch(0.5148 0.1337 146.82)" }, // #237B35
        warning: { color: "oklch(0.561 0.116571 78.9352)" }, // #996B00
      },
    },
  },

  rabbit: {
    base: BASE_50P,
    chroma: 0.2232,
    formRadius: "extra-large",
    hue: 36.66,
    label: "Rabbit",
    lightness: 0.6678,
    radius: "medium",
    semanticOverrides: {
      dark: {
        danger: { color: "oklch(0.6291 0.2565 29.09)" }, // #FF0606
        success: { color: "oklch(0.7113 0.2043 140.81)" }, // #4ABF34
      },
      light: {
        danger: { color: "oklch(0.6291 0.2565 29.09)" }, // #FF0606
        success: { color: "oklch(0.7113 0.2043 140.81)" }, // #4ABF34
      },
    },
  },

  sky: {
    base: BASE_DEFAULT,
    chroma: 0.16,
    formRadius: "large",
    hue: 225,
    label: "Sky",
    lightness: 0.78,
    radius: "medium",
  },

  spotify: {
    base: BASE_10P_LEFT,
    chroma: 0.2124,
    formRadius: "extra-small",
    hue: 148.67,
    label: "Spotify",
    lightness: 0.7697,
    radius: "medium",
    semanticOverrides: {
      dark: {
        danger: { color: "oklch(0.5931 0.2338 25.42)" }, // #E91429
        success: { color: "oklch(0.7697 0.2124 148.67)" }, // #1ED760
        warning: { color: "oklch(0.7921 0.1626 67.42)" }, // #FFA42B
      },
      light: {
        danger: { color: "oklch(0.5509 0.2166 25.29)" }, // #D31225
        success: { color: "oklch(0.6072 0.1647 149.02)" }, // #169C46
        warning: { color: "oklch(0.6972 0.1687 54.22)" }, // #EB7B15
      },
    },
  },

  uber: {
    base: BASE_FULL_LEFT,
    chroma: 0,
    formRadius: "small",
    hue: 0,
    label: "Uber",
    lightness: 0,
    radius: "small",
    semanticOverrides: {
      dark: {
        danger: { color: "oklch(0.7044 0.1872 23.19)" }, // #FF6666
        success: { color: "oklch(0.6514 0.1321 156.22)" }, // #3AA76D
        warning: { color: "oklch(0.8803 0.1348 86.06)" }, // #FFD166
      },
      light: {
        danger: { color: "oklch(0.573 0.2249 21.97)" }, // #DE1135
        success: { color: "oklch(0.6277 0.1604 153.06)" }, // #05A357
        warning: { color: "oklch(0.8446 0.1525 80.6)" }, // #FFC043
      },
    },
  },
} as const satisfies Record<string, ThemePreset>;

export type ThemeId = keyof typeof presets;

/**
 * Presentation order: `default` first, then `hero`, then the rest as HeroUI's gallery lists them.
 * Drives `themes/all.css` and the Storybook toolbar.
 */
export const themeIds: ThemeId[] = [
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
];

/**
 * Accents that must flip between light and dark rather than staying put.
 * Uber's accent is pure black, which is invisible on a dark background.
 */
export const adaptiveAccents: Record<string, { light: string; dark: string }> = {
  "oklch(0 0 0)": { dark: "oklch(0.9848 0 0)", light: "oklch(0 0 0)" },
};
