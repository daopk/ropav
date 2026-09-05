/**
 * Every bundled theme — GENERATED, do not edit by hand.
 *
 * Run `pnpm generate:themes` after changing `scripts/themes/presets.ts`.
 *
 * `themeIds` is in presentation order, which a picker should follow. `themeLabels` is keyed
 * for the linter, so read the order from `themeIds` and the name from here.
 */

export const themeIds = [
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

export type ThemeId = (typeof themeIds)[number];

export const themeLabels: Record<ThemeId, string> = {
  airbnb: "Airbnb",
  coinbase: "Coinbase",
  default: "Default",
  discord: "Discord",
  hero: "Hero",
  lavender: "Lavender",
  mint: "Mint",
  netflix: "Netflix",
  rabbit: "Rabbit",
  sky: "Sky",
  spotify: "Spotify",
  uber: "Uber",
};
