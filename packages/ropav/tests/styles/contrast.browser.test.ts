import { afterEach, describe, expect, it } from "vitest";

// Every bundled theme, because contrast is the one thing a theme can break on its own: the
// generator varies hue and chroma per theme while the lightness of most tokens is shared, so a
// pairing that clears the floor in one palette can miss in another.
import "../../../styles/themes/airbnb.css";
import "../../../styles/themes/coinbase.css";
import "../../../styles/themes/discord.css";
import "../../../styles/themes/hero.css";
import "../../../styles/themes/lavender.css";
import "../../../styles/themes/mint.css";
import "../../../styles/themes/netflix.css";
import "../../../styles/themes/rabbit.css";
import "../../../styles/themes/sky.css";
import "../../../styles/themes/spotify.css";
import "../../../styles/themes/uber.css";

/**
 * Text contrast, per token pair, across every theme and both schemes.
 *
 * The story suite in `@ropav/storybook` runs axe over the rendered library, which is what finds
 * *which* pairings occur in real composition. It cannot own this: it renders one theme, and a
 * contrast failure is a property of two tokens rather than of the story that happened to put them
 * together. Re-rendering every story once per theme would rediscover the same handful of pairs in
 * every one of them, so the pairs it found are checked here directly instead - no rendering, every
 * theme-and-scheme combination, and a failure names the token rather than the component.
 *
 * The floor is WCAG AA for normal text. Large text and disabled controls are exempt and are not
 * listed; every pair below carries ordinary body text somewhere in the library.
 */

/** The 4.5:1 floor from WCAG 2.2 SC 1.4.3, for text below 18.66px bold / 24px regular. */
const AA_NORMAL_TEXT = 4.5;

const THEMES = [
  "default",
  "airbnb",
  "coinbase",
  "discord",
  "hero",
  "lavender",
  "mint",
  "netflix",
  "rabbit",
  "sky",
  "spotify",
  "uber",
] as const;

const SCHEMES = ["light", "dark"] as const;

type Pair = {
  /** Why this pairing exists, so a failure says what to look at. */
  readonly bg: string;
  readonly fg: string;
  /** Themes and schemes this pair is known to miss in, with the measurement. */
  readonly knownDebt?: readonly string[];
};

const PAIRS: readonly Pair[] = [
  { bg: "--background", fg: "--foreground" },
  { bg: "--background", fg: "--muted" },
  { bg: "--surface", fg: "--muted" },
  { bg: "--surface", fg: "--surface-foreground" },
  { bg: "--surface-secondary", fg: "--muted" },
  { bg: "--surface-tertiary", fg: "--muted" },
  { bg: "--overlay", fg: "--overlay-foreground" },
  { bg: "--field-background", fg: "--field-foreground" },
  { bg: "--field-background", fg: "--field-placeholder" },
  { bg: "--default", fg: "--default-foreground" },
  {
    bg: "--success",
    fg: "--success-foreground",
    knownDebt: [
      "airbnb/light", // 4.39
      "airbnb/dark", // 2.96
      "coinbase/light", // 4.43
      "spotify/light", // 3.40
      "uber/light", // 3.13
    ],
  },
  {
    bg: "--warning",
    fg: "--warning-foreground",
    knownDebt: [
      "airbnb/light", // 2.92
      "netflix/light", // 4.46
    ],
  },
  /**
   * Measured, not guessed. Every entry is one theme and one scheme that sits below the floor, with
   * the ratio it sits at - `--accent` and `--danger` carry brand identity, and lifting either
   * means a visibly darker blue or red across the themes that use them.
   */
  {
    bg: "--accent",
    fg: "--accent-foreground",
    knownDebt: [
      "default/light", // 3.63
      "default/dark", // 3.63
      "airbnb/light", // 3.43
      "airbnb/dark", // 3.43
      "discord/light", // 4.49
      "discord/dark", // 4.49
      "hero/light", // 3.59
      "hero/dark", // 3.59
    ],
  },
  {
    bg: "--background",
    fg: "--danger",
    knownDebt: [
      "default/light", // 3.27
      "airbnb/dark", // 3.65
      "discord/light", // 4.20
      "hero/light", // 3.27
      "lavender/light", // 3.26
      "mint/light", // 3.30
      "netflix/dark", // 3.00
      "rabbit/light", // 3.64
      "sky/light", // 3.28
      "spotify/dark", // 4.44
    ],
  },
  {
    bg: "--danger",
    fg: "--danger-foreground",
    knownDebt: [
      "default/light", // 3.48
      "default/dark", // 4.35
      "discord/light", // 4.24
      "discord/dark", // 3.56
      "hero/light", // 3.48
      "hero/dark", // 4.35
      "lavender/light", // 3.46
      "lavender/dark", // 4.32
      "mint/light", // 3.51
      "mint/dark", // 4.38
      "rabbit/light", // 3.69
      "rabbit/dark", // 3.69
      "sky/light", // 3.49
      "sky/dark", // 4.37
      "spotify/dark", // 4.24
    ],
  },
];

const hosts: HTMLElement[] = [];

/**
 * Resolves a token to the rgb the browser paints it as.
 *
 * Through a canvas, because `getComputedStyle` hands an `oklch()` back unchanged: parsing that
 * string reads the hue as a blue channel, which yields a plausible number for every pair and a
 * table where nothing ever fails.
 */
const paint = (element: HTMLElement, tokens: readonly string[]) => {
  const canvas = document.createElement("canvas");

  canvas.width = 1;
  canvas.height = 1;

  const context = canvas.getContext("2d")!;
  const style = getComputedStyle(element);

  return tokens.map((token) => {
    const value = style.getPropertyValue(token).trim();

    context.clearRect(0, 0, 1, 1);
    context.fillStyle = value;
    context.fillRect(0, 0, 1, 1);

    return [...context.getImageData(0, 0, 1, 1).data].slice(0, 3) as number[];
  });
};

const luminance = ([red, green, blue]: number[]) =>
  [red!, green!, blue!]
    .map((channel) => {
      const ratio = channel / 255;

      return ratio <= 0.03928 ? ratio / 12.92 : ((ratio + 0.055) / 1.055) ** 2.4;
    })
    .reduce((total, channel, index) => total + [0.2126, 0.7152, 0.0722][index]! * channel, 0);

const contrast = (a: number[], b: number[]) => {
  const [first, second] = [luminance(a), luminance(b)];

  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
};

const mount = (theme: string, scheme: string) => {
  const host = document.createElement("div");

  host.setAttribute("data-theme", theme);
  host.className = scheme;
  document.body.appendChild(host);
  hosts.push(host);

  return host;
};

afterEach(() => {
  for (const host of hosts.splice(0)) host.remove();
});

describe("token contrast (browser)", () => {
  it("resolves tokens rather than reading the oklch back", () => {
    // The whole table is vacuous if this is wrong - every pair would compare two misparsed
    // numbers and agree with itself.
    const [resolved] = paint(mount("default", "light"), ["--background"]);

    expect(resolved).toEqual([245, 245, 245]);
  });

  for (const theme of THEMES) {
    for (const scheme of SCHEMES) {
      describe(`${theme}/${scheme}`, () => {
        for (const { bg, fg, knownDebt } of PAIRS) {
          const isDebt = knownDebt?.includes(`${theme}/${scheme}`) ?? false;

          it(`${isDebt ? "records" : "clears AA for"} ${fg} on ${bg}`, () => {
            const [foreground, background] = paint(mount(theme, scheme), [fg, bg]);
            const ratio = contrast(foreground!, background!);

            // Debt is asserted from both sides. A pair listed here that starts passing means the
            // list is stale, and leaving it would quietly re-admit a real regression later.
            if (isDebt) expect(ratio).toBeLessThan(AA_NORMAL_TEXT);
            else expect(ratio).toBeGreaterThanOrEqual(AA_NORMAL_TEXT);
          });
        }
      });
    }
  }
});
