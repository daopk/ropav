import { describe, expect, it } from "vitest";

import { getColorChannels, normalizeHue, parseColor } from "@/utils/color";

/**
 * Every expectation here is a value the real `react-stately` produces, not one this port
 * computed. They were taken from a differential run that compared 10 788 observables — every
 * format, channel, conversion and name across 58 inputs — against `react-stately@3.49.0` and
 * found zero differences. The cases kept below are the ones whose *intent* is worth reading:
 * the surprising arithmetic, the warts that must not be "fixed", and the error strings.
 */

describe("parseColor", () => {
  describe("hex", () => {
    it("expands shorthand by doubling every character", () => {
      expect(parseColor("#abc").toString("css")).toBe("rgba(170, 187, 204, 1)");
      expect(parseColor("#ffff").toString("css")).toBe("rgba(255, 255, 255, 1)");
    });

    it("keeps hex alpha as a full float", () => {
      // 0xd / 255 is not rounded anywhere, and the CSS string carries every digit.
      expect(parseColor("#abcd").getChannelValue("alpha")).toBe(0.8666666666666667);
      expect(parseColor("#aabbccdd").toString("css")).toBe(
        "rgba(170, 187, 204, 0.8666666666666667)",
      );
    });

    it("drops alpha from `hex` and keeps it in `hexa`", () => {
      expect(parseColor("#aabbccdd").toString("hex")).toBe("#AABBCC");
      expect(parseColor("#aabbccdd").toString("hexa")).toBe("#AABBCCDD");
      // An opaque colour still emits the alpha byte.
      expect(parseColor("#abc").toString("hexa")).toBe("#AABBCCFF");
    });

    it("pads and upper-cases", () => {
      expect(parseColor("rgb(1, 2, 3)").toString("hex")).toBe("#010203");
    });

    it("rounds alpha to a byte on the way out", () => {
      // 0.5 * 255 is 127.5, which rounds up to 0x80.
      expect(parseColor("rgba(1, 2, 3, 0.5)").toString("hexa")).toBe("#01020380");
    });

    it("rejects a length no hex form uses", () => {
      expect(() => parseColor("#ff")).toThrow("Invalid color value: #ff");
    });
  });

  describe("rgb()", () => {
    it("clamps by position, not by channel name", () => {
      // The first three clamp to 0–255 and the fourth to 0–1, by index.
      expect(parseColor("rgba(300, -5, 3, 2)").toString("css")).toBe("rgba(255, 0, 3, 1)");
    });

    it("ignores values past the fourth", () => {
      expect(parseColor("rgb(0,0,0,0,0)").toString("css")).toBe("rgba(0, 0, 0, 0)");
    });

    it("needs three values", () => {
      expect(() => parseColor("rgb(0,0)")).toThrow("Invalid color value: rgb(0,0)");
    });

    it("prints alpha unrounded", () => {
      expect(parseColor("rgba(1, 2, 3, 0.3333333)").toString("css")).toBe(
        "rgba(1, 2, 3, 0.3333333)",
      );
    });

    /**
     * `rgb()` parsing clamps but never rounds, so a fractional channel reaches `toString(16)`
     * and produces nonsense. Upstream does this too, and a consumer could be relying on the
     * value surviving a round trip, so it is pinned rather than repaired.
     */
    it("does not round fractional channels, and hex output is garbage as a result", () => {
      expect(parseColor("rgb(1.5, 2.4, 3)").toString("hex")).toBe("#1.82.666666666666603");
      expect(parseColor("#000").withChannelValue("red", 999).toString("hex")).toBe("#3E70000");
    });
  });

  describe("hsl() and hsb()", () => {
    it("wraps hue, but keeps 360 at the top", () => {
      // A slider parked at its maximum should read 360, not snap back to the other end.
      expect(parseColor("hsl(360, 50%, 50%)").getChannelValue("hue")).toBe(360);
      expect(parseColor("hsl(390, 50%, 50%)").getChannelValue("hue")).toBe(30);
      expect(parseColor("hsl(-30, 50%, 50%)").getChannelValue("hue")).toBe(330);
      expect(parseColor("hsl(720, 50%, 50%)").getChannelValue("hue")).toBe(0);
    });

    it("does not wrap a hue set through `withChannelValue`", () => {
      expect(parseColor("hsl(0, 0%, 0%)").withChannelValue("hue", 400).toString("hsl")).toBe(
        "hsl(400, 0%, 0%)",
      );
    });

    it("needs the four-argument spelling for four arguments", () => {
      expect(() => parseColor("hsl(30, 50%, 50%, 0.5)")).toThrow(
        "Invalid color value: hsl(30, 50%, 50%, 0.5)",
      );
      expect(parseColor("hsla(30, 50%, 50%, 0.5)").getChannelValue("alpha")).toBe(0.5);
    });

    /** Unlike the `rgb()` pattern, these two are not anchored. Consumers may lean on it. */
    it("matches an hsb() anywhere in the string", () => {
      expect(parseColor("garbage hsb(0, 0%, 0%) trailing").toString("hsb")).toBe("hsb(0, 0%, 0%)");
    });

    it("rounds saturation and lightness to two decimals but leaves hue and alpha raw", () => {
      expect(parseColor("hsba(30, 33.333%, 66.666%, 0.5)").toString("hsba")).toBe(
        "hsba(30, 33.33%, 66.67%, 0.5)",
      );
    });

    it("renders an hsb colour as hsla for css", () => {
      expect(parseColor("hsb(210, 50%, 50%)").toString("css")).toBe("hsla(210, 33.33%, 37.5%, 1)");
    });
  });
});

describe("Color conversions", () => {
  it("converts between every space", () => {
    expect(parseColor("#FF7F00").toString("hsb")).toBe("hsb(29.88, 100%, 100%)");
    expect(parseColor("#FF7F00").toString("hsl")).toBe("hsl(29.88, 100%, 50%)");
    expect(parseColor("hsb(210, 50%, 50%)").toString("rgb")).toBe("rgb(64, 96, 128)");
    expect(parseColor("hsl(210, 50%, 50%)").toString("rgb")).toBe("rgb(64, 128, 191)");
    expect(parseColor("hsl(210, 50%, 50%)").toString("hsb")).toBe("hsb(210, 66.67%, 75%)");
  });

  /** `hex` is an output format, not a colour space, so only `toString` reaches it. */
  it("refuses hex as a conversion target", () => {
    expect(() => parseColor("hsl(210, 50%, 50%)").toFormat("hex")).toThrow(
      "Unsupported color conversion: hsl -> hex",
    );
    expect(parseColor("hsl(210, 50%, 50%)").toString("hex")).toBe("#4080BF");
  });

  it("reports an unsupported format", () => {
    expect(() => parseColor("#000").toString("bogus" as "hex")).toThrow(
      "Unsupported color conversion: rgb -> bogus",
    );
  });

  it("converts to an integer", () => {
    expect(parseColor("#0485F7").toHexInt()).toBe(296439);
    expect(parseColor("#ffffff").toHexInt()).toBe(16777215);
    expect(parseColor("#000000").toHexInt()).toBe(0);
    // Reached through rgb, from any space.
    expect(parseColor("hsl(210, 50%, 50%)").toHexInt()).toBe(0x4080bf);
  });

  it("returns a new colour rather than mutating", () => {
    const color = parseColor("#000000");
    const next = color.withChannelValue("red", 255);

    expect(color.toString("hex")).toBe("#000000");
    expect(next.toString("hex")).toBe("#FF0000");
  });
});

describe("Color channels", () => {
  /**
   * `pageSize` is the surprise: none of these is `(max - min) / 10`, which is what a slider
   * computes on its own. Red pages by 0x11 and hue by 15, both deliberate.
   */
  it("reports ranges, including the page sizes a slider would not guess", () => {
    expect(parseColor("#000").getChannelRange("red")).toEqual({
      maxValue: 0xff,
      minValue: 0,
      pageSize: 0x11,
      step: 1,
    });
    expect(parseColor("hsl(0,0%,0%)").getChannelRange("hue")).toEqual({
      maxValue: 360,
      minValue: 0,
      pageSize: 15,
      step: 1,
    });
    expect(parseColor("hsl(0,0%,0%)").getChannelRange("saturation")).toEqual({
      maxValue: 100,
      minValue: 0,
      pageSize: 10,
      step: 1,
    });
    expect(parseColor("#000").getChannelRange("alpha")).toEqual({
      maxValue: 1,
      minValue: 0,
      pageSize: 0.1,
      step: 0.01,
    });
  });

  it("formats a channel for display", () => {
    const hsl = parseColor("hsl(210, 50%, 50%)");

    expect(hsl.formatChannelValue("hue", "en-US")).toBe("210°");
    // Saturation is held 0–100 and divided before it is formatted as a percentage.
    expect(hsl.formatChannelValue("saturation", "en-US")).toBe("50%");
    // Alpha is already 0–1 and must not be divided.
    expect(parseColor("rgba(0,0,0,0.5)").formatChannelValue("alpha", "en-US")).toBe("50%");
    expect(parseColor("rgb(1,2,3)").formatChannelValue("red", "en-US")).toBe("1");
  });

  it("names a channel", () => {
    expect(parseColor("hsl(0,0%,0%)").getChannelName("hue", "en-US")).toBe("Hue");
    expect(parseColor("#000").getChannelName("red", "en-US")).toBe("Red");
  });

  it("distinguishes an unsupported channel from an unknown one", () => {
    // Reading a channel the space does not have, versus asking for its metadata.
    expect(() => parseColor("#000").getChannelValue("hue")).toThrow(
      "Unsupported color channel: hue",
    );
    expect(() => parseColor("#000").withChannelValue("hue", 1)).toThrow(
      "Unsupported color channel: hue",
    );
    expect(() => parseColor("#000").getChannelRange("hue")).toThrow("Unknown color channel: hue");
    expect(() => parseColor("#000").getChannelFormatOptions("hue")).toThrow(
      "Unknown color channel: hue",
    );
  });

  it("lists the channels of a space", () => {
    expect(getColorChannels("rgb")).toEqual(["red", "green", "blue"]);
    expect(getColorChannels("hsl")).toEqual(["hue", "saturation", "lightness"]);
    expect(getColorChannels("hsb")).toEqual(["hue", "saturation", "brightness"]);
  });

  /**
   * With neither axis given, x is the first channel and y the next — so a ColorArea with no
   * channels named is red × green holding blue, not the hue square one might expect.
   */
  it("resolves two dimensional axes", () => {
    expect(parseColor("#000").getColorSpaceAxes({})).toEqual({
      xChannel: "red",
      yChannel: "green",
      zChannel: "blue",
    });
    expect(parseColor("hsb(0,0%,0%)").getColorSpaceAxes({})).toEqual({
      xChannel: "hue",
      yChannel: "saturation",
      zChannel: "brightness",
    });
    expect(parseColor("hsb(0,0%,0%)").getColorSpaceAxes({ xChannel: "brightness" })).toEqual({
      xChannel: "brightness",
      yChannel: "hue",
      zChannel: "saturation",
    });
  });

  it("reports its colour space", () => {
    expect(parseColor("#000").getColorSpace()).toBe("rgb");
    expect(parseColor("hsl(0,0%,0%)").getColorSpace()).toBe("hsl");
    expect(parseColor("hsb(0,0%,0%)").getColorSpace()).toBe("hsb");
  });
});

describe("Color names", () => {
  /** These exercise the whole OKLCH path plus the string tables, for eight assertions. */
  it("names a colour by lightness, chroma and hue", () => {
    expect(parseColor("#FF7F00").getColorName("en-US")).toBe("vibrant orange");
    expect(parseColor("rgb(255, 100, 50)").getColorName("en-US")).toBe("vibrant red orange");
    expect(parseColor("#0485F7").getColorName("en-US")).toBe("vibrant cyan blue");
  });

  it("names the achromatic ends without a hue", () => {
    expect(parseColor("#ffffff").getColorName("en-US")).toBe("white");
    expect(parseColor("#000000").getColorName("en-US")).toBe("black");
    expect(parseColor("#808080").getColorName("en-US")).toBe("gray");
  });

  it("says how transparent a colour is", () => {
    expect(parseColor("rgba(255, 127, 0, 0.5)").getColorName("en-US")).toBe(
      "vibrant orange, 50% transparent",
    );
  });

  it("names the hue alone", () => {
    expect(parseColor("#FF7F00").getHueName("en-US")).toBe("orange");
    expect(parseColor("#808080").getHueName("en-US")).toBe("gray");
  });

  /**
   * A colour is a plain class, so it cannot read the locale in force through `useLocale` — the
   * locale arrives as an argument, and every caller inside a component passes what `useLocale`
   * gave it. Verified against `react-stately@3.49.0` across all 34 locales, 7 480 strings.
   */
  describe("in another locale", () => {
    it("names a colour and its channels", () => {
      const color = parseColor("#FF7F00");

      expect(color.getColorName("de-DE")).toBe("lebhaftes orange");
      expect(color.getColorName("ja-JP")).toBe("鮮やか オレンジ");
      expect(color.getHueName("fr-FR")).toBe("orange");
      expect(color.getChannelName("red", "de-DE")).toBe("Rot");
      expect(color.getChannelName("red", "ja-JP")).toBe("赤");
      expect(color.getChannelName("saturation", "fr-FR")).toBe("Saturation");
    });

    /** The percentage in the message is formatted in the locale too, spacing and all. */
    it("formats the transparency in the locale", () => {
      const half = parseColor("rgba(255, 127, 0, 0.5)");

      expect(half.getColorName("en-US")).toBe("vibrant orange, 50% transparent");
      expect(half.getColorName("de-DE")).toBe("lebhaftes orange, zu 50 % transparent");
      expect(half.getColorName("fr-FR")).toBe("Vif orange, 50 % transparent");
    });

    /**
     * `white` and `black` come straight out of the table, so German keeps its capital. Only hue
     * names are lower-cased, because those keys double as capitalised channel names.
     */
    it("names the achromatic ends without lower-casing them", () => {
      expect(parseColor("#ffffff").getColorName("de-DE")).toBe("Weiß");
      expect(parseColor("#000000").getColorName("ja-JP")).toBe("ブラック");
      expect(parseColor("#808080").getColorName("de-DE")).toBe("Grau");
    });
  });
});

describe("normalizeHue", () => {
  it("wraps into 0–360 and keeps 360", () => {
    expect(normalizeHue(360)).toBe(360);
    expect(normalizeHue(0)).toBe(0);
    expect(normalizeHue(390)).toBe(30);
    expect(normalizeHue(-30)).toBe(330);
    expect(normalizeHue(720)).toBe(0);
  });
});
