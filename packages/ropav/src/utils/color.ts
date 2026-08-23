import type { ColorStringKey } from "../i18n/color";
import type {
  Color,
  ColorAxes,
  ColorChannel,
  ColorChannelRange,
  ColorFormat,
  ColorSpace,
} from "./color-types";

import { NumberFormatter } from "@internationalized/number";
import { LocalizedStringDictionary, LocalizedStringFormatter } from "@internationalized/string";

import { colorStrings } from "../i18n/color";

import {
  GRAY_THRESHOLD,
  MAX_DARK_LIGHTNESS,
  OKLCH_HUES,
  ORANGE_LIGHTNESS_THRESHOLD,
  YELLOW_GREEN_LIGHTNESS_THRESHOLD,
  rgbToOKLCH,
} from "./color-oklch";
import { clamp, toFixedNumber } from "./number";

/**
 * The colour model.
 *
 * Ported from React Stately's `color/Color.ts` (react-stately 3.49.0). `@internationalized/color`
 * does not exist — the implementation lives inside `react-stately`, which peer-depends React — so
 * there is no package to depend on and this is a hand port. The parse regexes, the channel ranges
 * and the conversion arithmetic are reproduced exactly, and the localised strings go through this
 * package's own locale layer via `i18n/color.ts`.
 *
 * Reproduced exactly includes the warts. `parseColor("rgb(1.5, 2.4, 3)")` really does stringify to
 * `"#1.82.666666666666603"`, because `rgb()` parsing clamps but never rounds. Tests pin those, so
 * a later "fix" shows up as a deliberate divergence rather than a silent one.
 */

/**
 * One dictionary for the whole module, exactly as upstream keeps one.
 *
 * A colour is a plain class, not a component, so it cannot reach the locale in force through
 * `useLocale` — which is why every naming method takes a `locale` argument instead. Upstream also
 * consults a global dictionary a server may have pre-loaded; this package has no such handoff, and
 * `useLocalizedStringFormatter` drops that lookup for the same reason.
 */
const dictionary = new LocalizedStringDictionary(colorStrings);

/**
 * Read one plain string out of the table.
 *
 * The cast is the honest shape of the lookup: hue names are composed at runtime
 * (`` `${hueName} ${nextName}` ``), so the key is only known to be one of the table's keys by
 * construction. Every name the buckets can compose is present in the table.
 */
const stringFor = (key: string, locale: string): string =>
  dictionary.getStringForLocale(key as ColorStringKey, locale) as string;

/**
 * Read and write channels by name without giving up type safety.
 *
 * Upstream does `channel in this` then `this[channel]`, which needs the channels to be public
 * index-signature properties. Under this repo's `strict` + `noPropertyAccessFromIndexSignature`
 * that does not typecheck, so each subclass answers for its own channels instead. Behaviour is
 * identical: an unsupported channel reads as `undefined`, which is what raises the error.
 */
abstract class ColorBase implements Color {
  protected abstract readChannel(channel: ColorChannel): number | undefined;

  protected abstract writeChannel(channel: ColorChannel, value: number): void;

  abstract clone(): ColorBase;

  abstract toFormat(format: ColorFormat): Color;

  abstract toString(format?: ColorFormat | "css"): string;

  abstract getChannelRange(channel: ColorChannel): ColorChannelRange;

  abstract getChannelFormatOptions(channel: ColorChannel): Intl.NumberFormatOptions;

  abstract formatChannelValue(channel: ColorChannel, locale: string): string;

  abstract getColorSpace(): ColorSpace;

  abstract getColorChannels(): [ColorChannel, ColorChannel, ColorChannel];

  toHexInt(): number {
    return this.toFormat("rgb").toHexInt();
  }

  getChannelValue(channel: ColorChannel): number {
    const value = this.readChannel(channel);

    if (value === undefined) throw new Error("Unsupported color channel: " + channel);

    return value;
  }

  withChannelValue(channel: ColorChannel, value: number): Color {
    if (this.readChannel(channel) === undefined) {
      throw new Error("Unsupported color channel: " + channel);
    }

    const next = this.clone();

    next.writeChannel(channel, value);

    return next;
  }

  getChannelName(channel: ColorChannel, locale: string): string {
    return stringFor(channel, locale);
  }

  /**
   * Resolve the three channels a two dimensional control needs.
   *
   * With neither channel given, x is the first channel of the space and y the next — so `hsb`
   * yields hue × saturation with brightness held, and `rgb` yields red × green with blue held.
   */
  getColorSpaceAxes(xyChannels: { xChannel?: ColorChannel; yChannel?: ColorChannel }): ColorAxes {
    const { xChannel, yChannel } = xyChannels;
    const channels = this.getColorChannels();
    const xCh = xChannel ?? channels.find((c) => c !== yChannel)!;
    const yCh = yChannel ?? channels.find((c) => c !== xCh)!;
    const zCh = channels.find((c) => c !== xCh && c !== yCh)!;

    return { xChannel: xCh, yChannel: yCh, zChannel: zCh };
  }

  /**
   * Name the colour: a lightness word, a chroma word and a hue word, any of which may be empty.
   *
   * Both thresholds and buckets are read in OKLCH, where lightness means the same thing at every
   * hue — see `color-oklch.ts`.
   */
  getColorName(locale: string): string {
    const rgb = this.toFormat("rgb");
    const [lightnessValue, chromaValue, hueValue] = rgbToOKLCH(
      rgb.getChannelValue("red"),
      rgb.getChannelValue("green"),
      rgb.getChannelValue("blue"),
    );

    if (lightnessValue > 0.999) return stringFor("white", locale);
    if (lightnessValue < 0.001) return stringFor("black", locale);

    const [hue, l] = this.getOklchHue(lightnessValue, chromaValue, hueValue, locale);

    let lightness = "";
    let chroma = "";

    if (chromaValue <= 0.1 && chromaValue >= GRAY_THRESHOLD) {
      chroma = l >= 0.7 ? "pale" : "grayish";
    } else if (chromaValue >= 0.15) {
      chroma = "vibrant";
    }

    if (l < 0.3) {
      lightness = "very dark";
    } else if (l < MAX_DARK_LIGHTNESS) {
      lightness = "dark";
    } else if (l < 0.7) {
      // Mid lightness carries no word at all: the hue names it.
    } else if (l < 0.85) {
      lightness = "light";
    } else {
      lightness = "very light";
    }

    if (chroma) chroma = stringFor(chroma, locale);
    if (lightness) lightness = stringFor(lightness, locale);

    const alpha = this.getChannelValue("alpha");
    const formatter = new LocalizedStringFormatter(locale, dictionary);

    /**
     * The collapse matters: any of the three words may be empty — a mid-lightness, mid-chroma
     * colour is named by its hue alone — and the message template joins them with spaces
     * regardless, so without it a screen reader would read `"  orange"`.
     */
    if (alpha < 1) {
      const percentTransparent = new NumberFormatter(locale, { style: "percent" }).format(
        1 - alpha,
      );

      return formatter
        .format("transparentColorName", { chroma, hue, lightness, percentTransparent })
        .replace(/\s+/g, " ")
        .trim();
    }

    return formatter.format("colorName", { chroma, hue, lightness }).replace(/\s+/g, " ").trim();
  }

  getHueName(locale: string): string {
    const rgb = this.toFormat("rgb");
    const [l, c, h] = rgbToOKLCH(
      rgb.getChannelValue("red"),
      rgb.getChannelValue("green"),
      rgb.getChannelValue("blue"),
    );
    const [name] = this.getOklchHue(l, c, h, locale);

    return name;
  }

  /**
   * Bucket an OKLCH triple into a hue name, and hand back a lightness that may have moved.
   *
   * Three adjustments, all upstream's: below the chroma threshold there is no hue at all, only
   * gray; orange splits into brown or orange by lightness, and the orange branch *shifts* the
   * lightness so the words that follow describe the orange range rather than the absolute one;
   * and a hue past the midpoint of its bucket takes the next hue's name as well, which is where
   * "cyan blue" and "yellow green" come from.
   */
  private getOklchHue(l: number, c: number, h: number, locale: string): [string, number] {
    if (c < GRAY_THRESHOLD) return [stringFor("gray", locale), l];

    let lightness = l;

    for (let i = 0; i < OKLCH_HUES.length; i++) {
      const [hue, name] = OKLCH_HUES[i]!;
      const [nextHue, nextName] = OKLCH_HUES[i + 1] ?? ([360, "pink"] as const);

      if (h >= hue && h < nextHue) {
        let hueName = name;

        if (hueName === "orange") {
          if (lightness < ORANGE_LIGHTNESS_THRESHOLD) {
            hueName = "brown";
          } else {
            lightness = lightness - ORANGE_LIGHTNESS_THRESHOLD + MAX_DARK_LIGHTNESS;
          }
        }

        if (h > hue + (nextHue - hue) / 2 && hueName !== nextName) {
          hueName = `${hueName} ${nextName}`;
        } else if (hueName === "yellow" && lightness < YELLOW_GREEN_LIGHTNESS_THRESHOLD) {
          hueName = "yellow green";
        }

        // Lower-cased because `red`/`green`/`blue` are channel names too, capitalised for that
        // reading; a hue wants the same key read as a colour.
        return [stringFor(hueName, locale).toLocaleLowerCase(locale), lightness];
      }
    }

    throw new Error("Unexpected hue");
  }
}

class RGBColor extends ColorBase {
  static colorChannels: [ColorChannel, ColorChannel, ColorChannel] = ["red", "green", "blue"];

  constructor(
    private red: number,
    private green: number,
    private blue: number,
    private alpha: number,
  ) {
    super();
  }

  /**
   * Parse `#rgb`, `#rgba`, `#rrggbb`, `#rrggbbaa`, `rgb()` and `rgba()`.
   *
   * Shorthand is expanded by doubling every character, and hex alpha is divided by 255 without
   * rounding — `#abcd` really does carry an alpha of `0.8666666666666667`. The `rgb()` branch
   * clamps per position (0–255 for the first three, 0–1 for alpha) and ignores anything past the
   * fourth value, so `rgb(0,0,0,0,0)` parses.
   */
  static parse(value: string): RGBColor | undefined {
    let colors: Array<number | undefined> = [];

    if (/^#[\da-f]+$/i.test(value) && [4, 5, 7, 9].includes(value.length)) {
      const values = (value.length < 6 ? value.replace(/[^#]/gi, "$&$&") : value)
        .slice(1)
        .split("");

      while (values.length > 0) {
        colors.push(parseInt(values.splice(0, 2).join(""), 16));
      }
      colors[3] = colors[3] !== undefined ? colors[3] / 255 : undefined;
    }

    const match = value.match(/^rgba?\((.*)\)$/);

    if (match?.[1]) {
      colors = match[1].split(",").map((part) => Number(part.trim()));
      colors = colors.map((num, i) => clamp(num ?? 0, 0, i < 3 ? 255 : 1));
    }

    if (colors[0] === undefined || colors[1] === undefined || colors[2] === undefined) {
      return undefined;
    }

    return colors.length < 3
      ? undefined
      : new RGBColor(colors[0], colors[1], colors[2], colors[3] ?? 1);
  }

  protected override readChannel(channel: ColorChannel): number | undefined {
    switch (channel) {
      case "red":
        return this.red;
      case "green":
        return this.green;
      case "blue":
        return this.blue;
      case "alpha":
        return this.alpha;
      default:
        return undefined;
    }
  }

  protected override writeChannel(channel: ColorChannel, value: number): void {
    switch (channel) {
      case "red":
        this.red = value;
        break;
      case "green":
        this.green = value;
        break;
      case "blue":
        this.blue = value;
        break;
      case "alpha":
        this.alpha = value;
        break;
      default:
        break;
    }
  }

  override toString(format: ColorFormat | "css" = "css"): string {
    switch (format) {
      case "hex":
        return (
          "#" +
          (
            this.red.toString(16).padStart(2, "0") +
            this.green.toString(16).padStart(2, "0") +
            this.blue.toString(16).padStart(2, "0")
          ).toUpperCase()
        );
      case "hexa":
        return (
          "#" +
          (
            this.red.toString(16).padStart(2, "0") +
            this.green.toString(16).padStart(2, "0") +
            this.blue.toString(16).padStart(2, "0") +
            Math.round(this.alpha * 255)
              .toString(16)
              .padStart(2, "0")
          ).toUpperCase()
        );
      case "rgb":
        return `rgb(${this.red}, ${this.green}, ${this.blue})`;
      case "css":
      case "rgba":
        return `rgba(${this.red}, ${this.green}, ${this.blue}, ${this.alpha})`;
      default:
        return this.toFormat(format).toString(format);
    }
  }

  override toFormat(format: ColorFormat): Color {
    switch (format) {
      case "hex":
      case "hexa":
      case "rgb":
      case "rgba":
        return this;
      case "hsb":
      case "hsba":
        return this.toHSB();
      case "hsl":
      case "hsla":
        return this.toHSL();
      default:
        throw new Error("Unsupported color conversion: rgb -> " + format);
    }
  }

  override toHexInt(): number {
    return (this.red << 16) | (this.green << 8) | this.blue;
  }

  /** Conversion formula adapted from https://en.wikipedia.org/wiki/HSL_and_HSV#From_RGB. */
  private toHSB(): Color {
    const red = this.red / 255;
    const green = this.green / 255;
    const blue = this.blue / 255;
    const min = Math.min(red, green, blue);
    const brightness = Math.max(red, green, blue);
    const chroma = brightness - min;
    const saturation = brightness === 0 ? 0 : chroma / brightness;

    let hue = 0;

    if (chroma !== 0) {
      switch (brightness) {
        case red:
          hue = (green - blue) / chroma + (green < blue ? 6 : 0);
          break;
        case green:
          hue = (blue - red) / chroma + 2;
          break;
        case blue:
          hue = (red - green) / chroma + 4;
          break;
        default:
          break;
      }

      hue /= 6;
    }

    return new HSBColor(
      toFixedNumber(hue * 360, 2),
      toFixedNumber(saturation * 100, 2),
      toFixedNumber(brightness * 100, 2),
      this.alpha,
    );
  }

  /** Conversion formula adapted from https://en.wikipedia.org/wiki/HSL_and_HSV#From_RGB. */
  private toHSL(): Color {
    const red = this.red / 255;
    const green = this.green / 255;
    const blue = this.blue / 255;
    const min = Math.min(red, green, blue);
    const max = Math.max(red, green, blue);
    const lightness = (max + min) / 2;
    const chroma = max - min;

    let hue: number;
    let saturation: number;

    if (chroma === 0) {
      hue = saturation = 0;
    } else {
      saturation = chroma / (lightness < 0.5 ? max + min : 2 - max - min);

      switch (max) {
        case red:
          hue = (green - blue) / chroma + (green < blue ? 6 : 0);
          break;
        case green:
          hue = (blue - red) / chroma + 2;
          break;
        case blue:
        default:
          hue = (red - green) / chroma + 4;
          break;
      }

      hue /= 6;
    }

    return new HSLColor(
      toFixedNumber(hue * 360, 2),
      toFixedNumber(saturation * 100, 2),
      toFixedNumber(lightness * 100, 2),
      this.alpha,
    );
  }

  override clone(): ColorBase {
    return new RGBColor(this.red, this.green, this.blue, this.alpha);
  }

  override getChannelRange(channel: ColorChannel): ColorChannelRange {
    switch (channel) {
      case "red":
      case "green":
      case "blue":
        return { maxValue: 0xff, minValue: 0x0, pageSize: 0x11, step: 0x1 };
      case "alpha":
        return { maxValue: 1, minValue: 0, pageSize: 0.1, step: 0.01 };
      default:
        throw new Error("Unknown color channel: " + channel);
    }
  }

  override getChannelFormatOptions(channel: ColorChannel): Intl.NumberFormatOptions {
    switch (channel) {
      case "red":
      case "green":
      case "blue":
        return { style: "decimal" };
      case "alpha":
        return { style: "percent" };
      default:
        throw new Error("Unknown color channel: " + channel);
    }
  }

  override formatChannelValue(channel: ColorChannel, locale: string): string {
    const options = this.getChannelFormatOptions(channel);
    const value = this.getChannelValue(channel);

    return new NumberFormatter(locale, options).format(value);
  }

  override getColorSpace(): ColorSpace {
    return "rgb";
  }

  override getColorChannels(): [ColorChannel, ColorChannel, ColorChannel] {
    return RGBColor.colorChannels;
  }
}

/**
 * `hsb(X, X%, X%)` and `hsba(X, X%, X%, X)`.
 *
 * Not anchored, unlike the `rgb()` pattern — so `"garbage hsb(0, 0%, 0%) trailing"` parses. That
 * is upstream's behaviour and consumers may rely on it, so the pattern is copied verbatim rather
 * than tightened.
 */
const HSB_REGEX =
  /hsb\(([-+]?\d+(?:.\d+)?\s*,\s*[-+]?\d+(?:.\d+)?%\s*,\s*[-+]?\d+(?:.\d+)?%)\)|hsba\(([-+]?\d+(?:.\d+)?\s*,\s*[-+]?\d+(?:.\d+)?%\s*,\s*[-+]?\d+(?:.\d+)?%\s*,\s*[-+]?\d(.\d+)?)\)/;

class HSBColor extends ColorBase {
  static colorChannels: [ColorChannel, ColorChannel, ColorChannel] = [
    "hue",
    "saturation",
    "brightness",
  ];

  constructor(
    private hue: number,
    private saturation: number,
    private brightness: number,
    private alpha: number,
  ) {
    super();
  }

  static parse(value: string): HSBColor | undefined {
    const m = value.match(HSB_REGEX);

    if (!m) return undefined;

    const [h, s, b, a] = (m[1] ?? m[2] ?? "")
      .split(",")
      .map((n) => Number(n.trim().replace("%", "")));

    return new HSBColor(
      normalizeHue(h!),
      clamp(s!, 0, 100),
      clamp(b!, 0, 100),
      clamp(a ?? 1, 0, 1),
    );
  }

  protected override readChannel(channel: ColorChannel): number | undefined {
    switch (channel) {
      case "hue":
        return this.hue;
      case "saturation":
        return this.saturation;
      case "brightness":
        return this.brightness;
      case "alpha":
        return this.alpha;
      default:
        return undefined;
    }
  }

  protected override writeChannel(channel: ColorChannel, value: number): void {
    switch (channel) {
      case "hue":
        this.hue = value;
        break;
      case "saturation":
        this.saturation = value;
        break;
      case "brightness":
        this.brightness = value;
        break;
      case "alpha":
        this.alpha = value;
        break;
      default:
        break;
    }
  }

  override toString(format: ColorFormat | "css" = "css"): string {
    switch (format) {
      case "css":
        return this.toHSL().toString("css");
      case "hex":
        return this.toRGB().toString("hex");
      case "hexa":
        return this.toRGB().toString("hexa");
      case "hsb":
        return `hsb(${this.hue}, ${toFixedNumber(this.saturation, 2)}%, ${toFixedNumber(this.brightness, 2)}%)`;
      case "hsba":
        return `hsba(${this.hue}, ${toFixedNumber(this.saturation, 2)}%, ${toFixedNumber(this.brightness, 2)}%, ${this.alpha})`;
      default:
        return this.toFormat(format).toString(format);
    }
  }

  override toFormat(format: ColorFormat): Color {
    switch (format) {
      case "hsb":
      case "hsba":
        return this;
      case "hsl":
      case "hsla":
        return this.toHSL();
      case "rgb":
      case "rgba":
        return this.toRGB();
      default:
        throw new Error("Unsupported color conversion: hsb -> " + format);
    }
  }

  /** Conversion formula adapted from https://en.wikipedia.org/wiki/HSL_and_HSV#HSV_to_HSL. */
  private toHSL(): Color {
    const brightness = this.brightness / 100;
    const lightness = brightness * (1 - this.saturation / 100 / 2);
    const saturation =
      lightness === 0 || lightness === 1
        ? 0
        : (brightness - lightness) / Math.min(lightness, 1 - lightness);

    return new HSLColor(
      toFixedNumber(this.hue, 2),
      toFixedNumber(saturation * 100, 2),
      toFixedNumber(lightness * 100, 2),
      this.alpha,
    );
  }

  /**
   * Conversion formula adapted from
   * https://en.wikipedia.org/wiki/HSL_and_HSV#HSV_to_RGB_alternative.
   */
  private toRGB(): Color {
    const hue = this.hue;
    const saturation = this.saturation / 100;
    const brightness = this.brightness / 100;
    const fn = (n: number, k = (n + hue / 60) % 6) =>
      brightness - saturation * brightness * Math.max(Math.min(k, 4 - k, 1), 0);

    return new RGBColor(
      Math.round(fn(5) * 255),
      Math.round(fn(3) * 255),
      Math.round(fn(1) * 255),
      this.alpha,
    );
  }

  override clone(): ColorBase {
    return new HSBColor(this.hue, this.saturation, this.brightness, this.alpha);
  }

  override getChannelRange(channel: ColorChannel): ColorChannelRange {
    switch (channel) {
      case "hue":
        return { maxValue: 360, minValue: 0, pageSize: 15, step: 1 };
      case "saturation":
      case "brightness":
        return { maxValue: 100, minValue: 0, pageSize: 10, step: 1 };
      case "alpha":
        return { maxValue: 1, minValue: 0, pageSize: 0.1, step: 0.01 };
      default:
        throw new Error("Unknown color channel: " + channel);
    }
  }

  override getChannelFormatOptions(channel: ColorChannel): Intl.NumberFormatOptions {
    switch (channel) {
      case "hue":
        return { style: "unit", unit: "degree", unitDisplay: "narrow" };
      case "saturation":
      case "brightness":
      case "alpha":
        return { style: "percent" };
      default:
        throw new Error("Unknown color channel: " + channel);
    }
  }

  /**
   * Saturation and brightness are stored 0–100 but formatted as percentages, so they are divided
   * first. Alpha is already 0–1 and must not be.
   */
  override formatChannelValue(channel: ColorChannel, locale: string): string {
    const options = this.getChannelFormatOptions(channel);
    const raw = this.getChannelValue(channel);
    const value = channel === "saturation" || channel === "brightness" ? raw / 100 : raw;

    return new NumberFormatter(locale, options).format(value);
  }

  override getColorSpace(): ColorSpace {
    return "hsb";
  }

  override getColorChannels(): [ColorChannel, ColorChannel, ColorChannel] {
    return HSBColor.colorChannels;
  }
}

/** `hsl(X, X%, X%)` and `hsla(X, X%, X%, X)`. Unanchored for the same reason as `HSB_REGEX`. */
const HSL_REGEX =
  /hsl\(([-+]?\d+(?:.\d+)?\s*,\s*[-+]?\d+(?:.\d+)?%\s*,\s*[-+]?\d+(?:.\d+)?%)\)|hsla\(([-+]?\d+(?:.\d+)?\s*,\s*[-+]?\d+(?:.\d+)?%\s*,\s*[-+]?\d+(?:.\d+)?%\s*,\s*[-+]?\d(.\d+)?)\)/;

class HSLColor extends ColorBase {
  static colorChannels: [ColorChannel, ColorChannel, ColorChannel] = [
    "hue",
    "saturation",
    "lightness",
  ];

  constructor(
    private hue: number,
    private saturation: number,
    private lightness: number,
    private alpha: number,
  ) {
    super();
  }

  static parse(value: string): HSLColor | undefined {
    const m = value.match(HSL_REGEX);

    if (!m) return undefined;

    const [h, s, l, a] = (m[1] ?? m[2] ?? "")
      .split(",")
      .map((n) => Number(n.trim().replace("%", "")));

    return new HSLColor(
      normalizeHue(h!),
      clamp(s!, 0, 100),
      clamp(l!, 0, 100),
      clamp(a ?? 1, 0, 1),
    );
  }

  protected override readChannel(channel: ColorChannel): number | undefined {
    switch (channel) {
      case "hue":
        return this.hue;
      case "saturation":
        return this.saturation;
      case "lightness":
        return this.lightness;
      case "alpha":
        return this.alpha;
      default:
        return undefined;
    }
  }

  protected override writeChannel(channel: ColorChannel, value: number): void {
    switch (channel) {
      case "hue":
        this.hue = value;
        break;
      case "saturation":
        this.saturation = value;
        break;
      case "lightness":
        this.lightness = value;
        break;
      case "alpha":
        this.alpha = value;
        break;
      default:
        break;
    }
  }

  override toString(format: ColorFormat | "css" = "css"): string {
    switch (format) {
      case "hex":
        return this.toRGB().toString("hex");
      case "hexa":
        return this.toRGB().toString("hexa");
      case "hsl":
        return `hsl(${this.hue}, ${toFixedNumber(this.saturation, 2)}%, ${toFixedNumber(this.lightness, 2)}%)`;
      case "css":
      case "hsla":
        return `hsla(${this.hue}, ${toFixedNumber(this.saturation, 2)}%, ${toFixedNumber(this.lightness, 2)}%, ${this.alpha})`;
      default:
        return this.toFormat(format).toString(format);
    }
  }

  override toFormat(format: ColorFormat): Color {
    switch (format) {
      case "hsl":
      case "hsla":
        return this;
      case "hsb":
      case "hsba":
        return this.toHSB();
      case "rgb":
      case "rgba":
        return this.toRGB();
      default:
        throw new Error("Unsupported color conversion: hsl -> " + format);
    }
  }

  /** Conversion formula adapted from https://en.wikipedia.org/wiki/HSL_and_HSV#HSL_to_HSV. */
  private toHSB(): Color {
    const lightness = this.lightness / 100;
    const brightness = lightness + (this.saturation / 100) * Math.min(lightness, 1 - lightness);
    const saturation = brightness === 0 ? 0 : 2 * (1 - lightness / brightness);

    return new HSBColor(
      toFixedNumber(this.hue, 2),
      toFixedNumber(saturation * 100, 2),
      toFixedNumber(brightness * 100, 2),
      this.alpha,
    );
  }

  /**
   * Conversion formula adapted from
   * https://en.wikipedia.org/wiki/HSL_and_HSV#HSL_to_RGB_alternative.
   */
  private toRGB(): Color {
    const hue = this.hue;
    const lightness = this.lightness / 100;
    const a = (this.saturation / 100) * Math.min(lightness, 1 - lightness);
    const fn = (n: number, k = (n + hue / 30) % 12) =>
      lightness - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);

    return new RGBColor(
      Math.round(fn(0) * 255),
      Math.round(fn(8) * 255),
      Math.round(fn(4) * 255),
      this.alpha,
    );
  }

  override clone(): ColorBase {
    return new HSLColor(this.hue, this.saturation, this.lightness, this.alpha);
  }

  override getChannelRange(channel: ColorChannel): ColorChannelRange {
    switch (channel) {
      case "hue":
        return { maxValue: 360, minValue: 0, pageSize: 15, step: 1 };
      case "saturation":
      case "lightness":
        return { maxValue: 100, minValue: 0, pageSize: 10, step: 1 };
      case "alpha":
        return { maxValue: 1, minValue: 0, pageSize: 0.1, step: 0.01 };
      default:
        throw new Error("Unknown color channel: " + channel);
    }
  }

  override getChannelFormatOptions(channel: ColorChannel): Intl.NumberFormatOptions {
    switch (channel) {
      case "hue":
        return { style: "unit", unit: "degree", unitDisplay: "narrow" };
      case "saturation":
      case "lightness":
      case "alpha":
        return { style: "percent" };
      default:
        throw new Error("Unknown color channel: " + channel);
    }
  }

  override formatChannelValue(channel: ColorChannel, locale: string): string {
    const options = this.getChannelFormatOptions(channel);
    const raw = this.getChannelValue(channel);
    const value = channel === "saturation" || channel === "lightness" ? raw / 100 : raw;

    return new NumberFormatter(locale, options).format(value);
  }

  override getColorSpace(): ColorSpace {
    return "hsl";
  }

  override getColorChannels(): [ColorChannel, ColorChannel, ColorChannel] {
    return HSLColor.colorChannels;
  }
}

/**
 * Wrap a hue into 0–360.
 *
 * `360` is special-cased rather than wrapped to `0`: a slider sitting at its maximum should read
 * as 360, not jump back to the other end.
 */
export const normalizeHue = (hue: number): number => {
  if (hue === 360) return hue;

  return ((hue % 360) + 360) % 360;
};

/** Parses a color from a string value. Throws an error if the string could not be parsed. */
export const parseColor = (value: string): Color => {
  const res = RGBColor.parse(value) ?? HSBColor.parse(value) ?? HSLColor.parse(value);

  if (res) return res;

  throw new Error("Invalid color value: " + value);
};

/** Accept either a string or an already-parsed colour. */
export const normalizeColor = (v: Color | string): Color =>
  typeof v === "string" ? parseColor(v) : v;

/** Returns a list of color channels for a given color space. */
export const getColorChannels = (
  colorSpace: ColorSpace,
): [ColorChannel, ColorChannel, ColorChannel] => {
  switch (colorSpace) {
    case "rgb":
      return RGBColor.colorChannels;
    case "hsl":
      return HSLColor.colorChannels;
    case "hsb":
      return HSBColor.colorChannels;
  }
};
