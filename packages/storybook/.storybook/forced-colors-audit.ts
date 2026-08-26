import { cdp } from "vitest/browser";

/**
 * Audits a rendered story under Forced Colors Mode (Windows High Contrast).
 *
 * The component suite asserts computed styles, and this whole class of bug is invisible to that.
 * The browser's colour override runs after the cascade and the backplate is painted later still,
 * so every declared colour keeps reporting correctly while the component renders as a blank
 * block. Three separate bugs shipped that way before this existed.
 *
 * So the audit compares the story against itself: what it resolves to with the mode off, and
 * what it resolves to with the mode on. Anything that carried a state and stops carrying it is
 * the failure. No baseline files and no pixels - the comparison is within a single run, which
 * also means it cannot drift with the platform's fonts.
 */

/** Attributes that make an element a state indicator rather than decoration. */
const STATE_SELECTOR = [
  "[data-selected='true']",
  "[data-active='true']",
  "[data-current='true']",
  "[data-today='true']",
  "[data-indeterminate='true']",
  "[aria-selected='true']",
  "[aria-checked='true']",
  "[aria-current]",
  // The proportion indicators carry no state attribute at all - they are a width and a colour.
  "[data-slot$='-fill']",
].join(",");

type Signature = {
  readonly bg: string;
  readonly distinguishable: boolean;
  readonly fca: string;
  readonly hasText: boolean;
};

const isTransparent = (color: string) => /,\s*0\)$/.test(color) || color === "transparent";

const channels = (color: string) =>
  color
    .match(/[\d.]+/g)
    ?.slice(0, 3)
    .join() ?? color;

/**
 * Painted, and not in the page's own colour - which under this mode means a system colour someone
 * chose on purpose.
 *
 * Compared on the channels rather than the whole value: the mode rewrites every author background
 * to `Canvas` while keeping its alpha, so a flattened tint reads as `Canvas` at 15% and has to be
 * told apart from a real fill. `Highlight` is itself semi-transparent in some palettes, so opacity
 * is no help either way.
 */
const isDeliberateFill = (color: string, canvas: string) =>
  !isTransparent(color) && channels(color) !== channels(canvas);

/** The background actually behind an element, looking past transparent ancestors. */
const effectiveBackground = (element: Element): string => {
  let node: Element | null = element;

  while (node) {
    const bg = getComputedStyle(node).backgroundColor;

    if (!isTransparent(bg)) return bg;
    node = node.parentElement;
  }

  return "";
};

const hasVisibleEdge = (style: CSSStyleDeclaration) => {
  const outlined =
    style.outlineStyle !== "none" &&
    Number.parseFloat(style.outlineWidth) > 0 &&
    !isTransparent(style.outlineColor);

  if (outlined) return true;

  return (["Top", "Right", "Bottom", "Left"] as const).some(
    (side) =>
      style[`border${side}Style`] !== "none" &&
      Number.parseFloat(style[`border${side}Width`]) > 0 &&
      !isTransparent(style[`border${side}Color`]),
  );
};

/** Whether an element paints anything that sets it apart from what is behind it. */
const isDistinguishable = (element: Element) => {
  const style = getComputedStyle(element);

  if (hasVisibleEdge(style)) return true;
  if (isTransparent(style.backgroundColor)) return false;

  const behind = element.parentElement ? effectiveBackground(element.parentElement) : "";

  return style.backgroundColor !== behind;
};

const hasDirectText = (element: Element) =>
  [...element.childNodes].some(
    (node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim(),
  );

const sign = (element: Element): Signature => {
  const style = getComputedStyle(element);

  return {
    bg: style.backgroundColor,
    distinguishable: isDistinguishable(element),
    fca: style.forcedColorAdjust,
    hasText: hasDirectText(element),
  };
};

const describe = (element: Element) => {
  const classes = element.className.toString().trim().split(/\s+/).filter(Boolean);
  const slot = element.getAttribute("data-slot");

  return `${element.tagName.toLowerCase()}${classes[0] ? `.${classes[0]}` : ""}${
    slot ? `[data-slot="${slot}"]` : ""
  }`;
};

const setForcedColors = (value: "active" | "none") =>
  cdp().send("Emulation.setEmulatedMedia", {
    features: [{ name: "forced-colors", value }],
  });

/**
 * Colour transitions are the reason this reads styles twice with a settle in between rather than
 * synchronously. Toggling the mode starts one on anything with a `transition`, and `getComputedStyle`
 * reports the value mid-flight - which reads as the exact failure being looked for.
 */
const stopMotion = () => {
  const style = document.createElement("style");

  style.dataset["forcedColorsAudit"] = "";
  style.textContent = `*, *::before, *::after {
    transition: none !important;
    animation: none !important;
  }`;
  document.head.appendChild(style);

  return () => style.remove();
};

const settle = () =>
  new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

export const forcedColorsAudit = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
  const targets = [...canvasElement.querySelectorAll(STATE_SELECTOR)];

  // Nothing in this story carries a state, so there is nothing that can lose one.
  if (targets.length === 0) return;

  const resumeMotion = stopMotion();

  try {
    await settle();
    const before = targets.map(sign);

    await setForcedColors("active");
    await settle();
    const after = targets.map(sign);

    const probe = document.createElement("span");

    probe.style.backgroundColor = "Canvas";
    document.body.appendChild(probe);

    const canvas = getComputedStyle(probe).backgroundColor;

    probe.remove();
    const findings: string[] = [];

    targets.forEach((element, index) => {
      const was = before[index]!;
      const now = after[index]!;

      // Carried a state by painting something, and now paints nothing that sets it apart.
      // A deliberate system-colour fill counts as painting even when an ancestor took the same
      // one - a range track and the cap sitting on it are one indicator, not a vanished cap.
      if (was.distinguishable && !now.distinguishable && !isDeliberateFill(now.bg, canvas)) {
        findings.push(
          `${describe(element)} stops standing out - background ${was.bg} flattens to ${now.bg} ` +
            `with no border or outline left to carry the state.`,
        );
      }

      // Chromium paints a `Canvas` backplate behind the text of any element that has text, on top
      // of that element's own background. A fill carrying a label therefore has to opt out, or the
      // label is covered by a solid plate.
      if (now.hasText && now.fca === "auto" && isDeliberateFill(now.bg, canvas)) {
        findings.push(
          `${describe(element)} puts a label on a ${now.bg} fill without ` +
            `\`forced-color-adjust: none\` - the backplate will cover it.`,
        );
      }
    });

    if (findings.length > 0) {
      throw new Error(
        `Forced Colors Mode breaks ${findings.length} indicator(s):\n${findings
          .map((finding) => `  - ${finding}`)
          .join("\n")}`,
      );
    }
  } finally {
    await setForcedColors("none");
    resumeMotion();
  }
};
