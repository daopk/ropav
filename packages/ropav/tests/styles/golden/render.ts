/**
 * Renders every case and reads back what the browser resolved.
 *
 * What a refactor moves is how declarations are written, not what they should compute to, so the
 * check that means anything is the computed value on a real element — after the cascade has
 * picked a winner, after `var()` has resolved, after the layer order has been applied. A diff of
 * declarations cannot see any of that, and those are the three things most likely to move.
 */

import type { Case } from "./cases";

import { firstSatisfiable } from "./selector-dom";

/**
 * A document of its own, carrying one stylesheet.
 *
 * A reset is a property of the page it is on, so two of them cannot share a document — and two
 * builds of the same stylesheet certainly cannot. An iframe is the cheapest second page there is.
 */
export const mount = (css: string): Document => {
  const frame = document.createElement("iframe");

  frame.setAttribute("style", "position:absolute;top:-100000px;left:0;width:1280px;height:720px");
  document.body.appendChild(frame);

  const doc = frame.contentDocument!;

  doc.open();
  doc.write("<!doctype html><html><head></head><body></body></html>");
  doc.close();

  const style = doc.createElement("style");

  style.textContent = css;
  doc.head.appendChild(style);

  return doc;
};

/** The document states the components are written against. */
export const MODES = {
  dark: { class: "dark" },
  "dark-reduced": { attrs: { "data-reduce-motion": "true" }, class: "dark" },
  light: {},
  reduced: { attrs: { "data-reduce-motion": "true" } },
} satisfies Record<string, { attrs?: Record<string, string>; class?: string }>;

export type Mode = keyof typeof MODES;

/**
 * Every property the stylesheet declares anywhere, which is the set worth reading back.
 *
 * Reading all ~340 of a computed style would bury the signal in properties nothing here sets;
 * reading only what a given rule declares would miss a declaration that *arrives* from somewhere
 * else, which is the failure the layer work can cause.
 */
export const declaredProperties = (sheets: StyleSheetList): string[] => {
  const props = new Set<string>();

  const walk = (rules: CSSRuleList) => {
    for (const rule of rules) {
      if ("style" in rule) {
        const style = (rule as CSSStyleRule).style;

        for (const prop of style) props.add(prop);
      }
      if ("cssRules" in rule) walk((rule as CSSGroupingRule).cssRules);
    }
  };

  for (const sheet of sheets) {
    try {
      walk((sheet as CSSStyleSheet).cssRules);
    } catch {
      continue;
    }
  }

  return [...props].sort();
};

/** The node in `clone` sitting where `node` sits in `root`. */
const locate = (clone: HTMLElement, root: HTMLElement, node: HTMLElement): HTMLElement => {
  const path: number[] = [];

  for (let el = node; el !== root; el = el.parentElement!) {
    path.unshift([...el.parentElement!.children].indexOf(el));
  }

  return path.reduce<HTMLElement>((at, index) => at.children[index] as HTMLElement, clone);
};

interface Rendered {
  reference: HTMLElement;
  target: HTMLElement;
  pseudoElement: string | null;
}

/** Mounts one wrapper per mode and builds every case inside each. */
export const renderAll = (cases: Case[], modes: Mode[], doc: Document) => {
  const host = doc.createElement("div");

  // Off-screen rather than hidden: `display: none` stops the browser resolving used values, and
  // half of what the components declare is a used value.
  host.setAttribute("style", "position:absolute;top:-100000px;left:0;width:1280px");
  doc.body.appendChild(host);

  const rendered = new Map<Mode, Map<string, Rendered>>();

  for (const mode of modes) {
    const wrapper = doc.createElement("div");
    const config = MODES[mode];

    if ("class" in config && config.class) wrapper.className = config.class;
    if ("attrs" in config) {
      for (const [name, value] of Object.entries(config.attrs)) wrapper.setAttribute(name, value);
    }
    host.appendChild(wrapper);

    const byId = new Map<string, Rendered>();

    for (const item of cases) {
      const built = firstSatisfiable(item.selector, doc);

      if (!built) continue;

      /*
       * The same tree with the last element's own identity taken off it.
       *
       * A reference built on its own would differ from the target in everything the ancestors
       * pass down — `color` alone drags `caret-color`, `text-decoration-color` and
       * `-webkit-text-fill-color` with it — and record all of it as though this rule had said so.
       * Keeping the chain and stripping only the leaf leaves exactly what matching *this* element
       * contributed.
       */
      const referenceRoot = built.root.cloneNode(true) as HTMLElement;
      const reference = locate(referenceRoot, built.root, built.target);

      while (reference.attributes.length) reference.removeAttribute(reference.attributes[0]!.name);

      /*
       * A box of its own, at a fixed size.
       *
       * Two thousand cases in one column makes every percentage length resolve against the column
       * — so a rule that changes one element's height moves the reported `block-size` of every
       * `inset-0` element in the matrix, and a one-line edit reads as hundreds of regressions.
       * A constant containing block is what makes a case's numbers mean only that case.
       */
      const box = doc.createElement("div");

      /*
       * `contain: layout` as well as a size, because a size alone does not hold a `position:
       * fixed` element — that resolves against the viewport, from a static position that moves
       * whenever the document's height does. Adding or removing rules changes how many cases are
       * mounted, so a toast region's `top` would report a different number every time the
       * stylesheet gained or lost one. Containment makes the box their containing block too.
       */
      box.setAttribute("style", "position:relative;contain:layout;width:1280px;height:720px");
      box.append(built.root, referenceRoot);
      wrapper.appendChild(box);
      byId.set(item.id, { pseudoElement: built.pseudoElement, reference, target: built.target });
    }
    rendered.set(mode, byId);
  }

  return { host, rendered };
};

/** What a rule's element resolves to, minus everything a bare element of that tag resolves to. */
export const styleDelta = (
  { pseudoElement, reference, target }: Rendered,
  properties: string[],
  view: Window,
): Record<string, string> => {
  const actual = view.getComputedStyle(target, pseudoElement);
  const base = view.getComputedStyle(reference, pseudoElement);
  const delta: Record<string, string> = {};

  for (const prop of properties) {
    const value = actual.getPropertyValue(prop);

    if (value && value !== base.getPropertyValue(prop)) delta[prop] = value;
  }

  return delta;
};
