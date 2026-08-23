/**
 * sRGB → OKLCH, and the hue table a colour name is bucketed into.
 *
 * Ported from React Stately's `color/Color.ts` (react-stately 3.49.0), which in turn follows the
 * conversion code in https://www.w3.org/TR/css-color-4/#color-conversion-code.
 *
 * Why OKLCH and not HSL: naming a colour needs *perceptual* lightness. In HSL, `hsl(60, 100%, 50%)`
 * and `hsl(240, 100%, 50%)` claim the same lightness while yellow reads as bright and blue as dark,
 * so a name derived from HSL calls both "yellow" and "blue" mid-lightness and gets one of them
 * badly wrong. OKLCH's L is uniform across hues, so a single set of thresholds works everywhere.
 *
 * Kept out of `utils/index.ts`: this is the colour model's internal machinery, not API.
 */

/** Lightness threshold between orange and brown. */
export const ORANGE_LIGHTNESS_THRESHOLD = 0.68;

/** Lightness threshold between pure yellow and "yellow green". */
export const YELLOW_GREEN_LIGHTNESS_THRESHOLD = 0.85;

/** The maximum lightness considered to be "dark". */
export const MAX_DARK_LIGHTNESS = 0.55;

/** The chroma threshold between gray and colour. */
export const GRAY_THRESHOLD = 0.001;

/**
 * Hue buckets, as `[degree at which the name starts, name]`.
 *
 * Uneven on purpose — the spans track how wide each hue reads to the eye in OKLCH, so blue owns
 * 89° (175–264) while red owns 33° (15–48). `pink` appears twice because the wheel wraps.
 */
export const OKLCH_HUES: ReadonlyArray<readonly [number, string]> = Object.freeze([
  Object.freeze([0, "pink"] as const),
  Object.freeze([15, "red"] as const),
  Object.freeze([48, "orange"] as const),
  Object.freeze([94, "yellow"] as const),
  Object.freeze([135, "green"] as const),
  Object.freeze([175, "cyan"] as const),
  Object.freeze([264, "blue"] as const),
  Object.freeze([284, "purple"] as const),
  Object.freeze([320, "magenta"] as const),
  Object.freeze([349, "pink"] as const),
]);

type Triple = [number, number, number];

const multiplyMatrix = (m: readonly number[], x: number, y: number, z: number): Triple => [
  m[0]! * x + m[1]! * y + m[2]! * z,
  m[3]! * x + m[4]! * y + m[5]! * z,
  m[6]! * x + m[7]! * y + m[8]! * z,
];

/**
 * Undo sRGB's transfer function for one component.
 *
 * The sign is carried separately so out-of-gamut negatives reflect through the origin rather than
 * producing `NaN` from a fractional power of a negative number.
 */
const linearizeComponent = (value: number): number => {
  const sign = value < 0 ? -1 : 1;
  const abs = Math.abs(value);

  if (abs <= 0.04045) return value / 12.92;

  return sign * Math.pow((abs + 0.055) / 1.055, 2.4);
};

/** Gamma-encoded sRGB in 0–1 to linear-light sRGB. */
export const linearizeSRGB = (r: number, g: number, b: number): Triple => [
  linearizeComponent(r),
  linearizeComponent(g),
  linearizeComponent(b),
];

/** Linear-light sRGB to CIE XYZ, using sRGB's own white point D65 (no chromatic adaptation). */
export const linearSRGBToXYZ = (r: number, g: number, b: number): Triple =>
  multiplyMatrix(
    [
      506752 / 1228815,
      87881 / 245763,
      12673 / 70218,
      87098 / 409605,
      175762 / 245763,
      12673 / 175545,
      7918 / 409605,
      87881 / 737289,
      1001167 / 1053270,
    ],
    r,
    g,
    b,
  );

/** CIE XYZ relative to D65 to OKLab. */
export const xyzToOKLab = (x: number, y: number, z: number): Triple => {
  const xyzToLMS = [
    0.819022437996703, 0.3619062600528904, -0.1288737815209879, 0.0329836539323885,
    0.9292868615863434, 0.0361446663506424, 0.0481771893596242, 0.2642395317527308,
    0.6335478284694309,
  ];
  const lmsToOKLab = [
    0.210454268309314, 0.7936177747023054, -0.0040720430116193, 1.9779985324311684,
    -2.4285922420485799, 0.450593709617411, 0.0259040424655478, 0.7827717124575296,
    -0.8086757549230774,
  ];

  const [a, b, c] = multiplyMatrix(xyzToLMS, x, y, z);

  return multiplyMatrix(lmsToOKLab, Math.cbrt(a), Math.cbrt(b), Math.cbrt(c));
};

/** OKLab to OKLCH: `[lightness, chroma, hue in degrees 0–360)]`. */
export const okLabToOKLCH = (l: number, a: number, b: number): Triple => {
  const hue = (Math.atan2(b, a) * 180) / Math.PI;

  return [l, Math.sqrt(a ** 2 + b ** 2), hue >= 0 ? hue : hue + 360];
};

/** sRGB channels in 0–255 to OKLCH. */
export const rgbToOKLCH = (red: number, green: number, blue: number): Triple => {
  const [r, g, b] = linearizeSRGB(red / 255, green / 255, blue / 255);
  const [x, y, z] = linearSRGBToXYZ(r, g, b);
  const [l, a, bb] = xyzToOKLab(x, y, z);

  return okLabToOKLCH(l, a, bb);
};
