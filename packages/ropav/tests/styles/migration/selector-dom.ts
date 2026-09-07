/**
 * Builds the smallest DOM a selector matches.
 *
 * The migration snapshot needs one rendered element per rule, and the rules are what say which
 * elements exist: `.rp-switch[aria-checked=true] .rp-switch__control` describes a control inside a
 * checked switch, and nothing else in the repository does. Reading the DOM back out of the
 * selector is the only way to cover every rule without hand-writing two thousand fixtures.
 *
 * Nothing here has to be right by inspection. Every synthesis is checked with `matches()` against
 * the selector it came from, so a gap in this parser shows up as a rejected case and a smaller
 * matrix — never as a case that silently measures the wrong element.
 */

/** A state no markup can hold on its own. `:hover` needs a pointer; `:focus` needs focus. */
const UNSATISFIABLE =
  /^(?:hover|active|focus|focus-visible|focus-within|target|visited|link|any-link|defined|autofill|-webkit-autofill|placeholder-shown|user-invalid|user-valid|popover-open|open|modal|fullscreen|picture-in-picture)$/;

/** Form-control pseudo-classes, and the markup that satisfies each. */
const CONTROL_STATES: Record<string, { attrs?: Record<string, string>; tag: string }> = {
  checked: { attrs: { checked: "", type: "checkbox" }, tag: "input" },
  disabled: { attrs: { disabled: "" }, tag: "input" },
  enabled: { tag: "input" },
  indeterminate: { attrs: { type: "checkbox" }, tag: "input" },
  required: { attrs: { required: "" }, tag: "input" },
};

interface Compound {
  /** Filler siblings to insert before this element, for `:nth-child()` and `:not(:first-child)`. */
  precedingFillers: number;
  /** Filler siblings to insert after it, for `:not(:last-child)`. */
  followingFillers: number;
  attrs: Record<string, string>;
  classes: string[];
  /** A `:has()` argument, built as a descendant subtree. */
  has: string[];
  pseudoElement: string | null;
  tag: string;
}

type Combinator = " " | ">" | "+" | "~";

interface Complex {
  combinators: Combinator[];
  compounds: Compound[];
}

const emptyCompound = (): Compound => ({
  attrs: {},
  classes: [],
  followingFillers: 0,
  has: [],
  precedingFillers: 0,
  pseudoElement: null,
  tag: "div",
});

/** Splits on a delimiter that is not inside brackets, parens or quotes. */
export const splitTopLevel = (input: string, delimiter: string): string[] => {
  const parts: string[] = [];
  let depth = 0;
  let quote: string | null = null;
  let start = 0;

  for (let i = 0; i < input.length; i++) {
    const char = input[i]!;

    if (quote) {
      if (char === quote && input[i - 1] !== "\\") quote = null;
      continue;
    }
    if (char === '"' || char === "'") quote = char;
    else if (char === "(" || char === "[") depth++;
    else if (char === ")" || char === "]") depth--;
    else if (char === delimiter && depth === 0) {
      parts.push(input.slice(start, i));
      start = i + 1;
    }
  }
  parts.push(input.slice(start));

  return parts.map((part) => part.trim()).filter(Boolean);
};

/**
 * Rewrites `:is()` and `:where()` whose alternative spans a combinator into plain descendant form.
 *
 * Tailwind compiles every variant into one, so `:is(.rp-card) .rp-card__body` arrives wrapped
 * several deep, and an argument like `.rp-calendar:has(…) > [data-slot="calendar-grid"]` describes
 * an ancestor the compound alone cannot express. Hoisting the ancestor half out to the left says
 * the same thing in a shape the builder can follow.
 *
 * The rewrite is not required to be sound — only useful. `matches()` is what decides, so a case it
 * gets wrong is dropped, not mismeasured.
 */
export const flattenIs = (selector: string): string => {
  for (let pass = 0; pass < 12; pass++) {
    const match = /:(?:is|where|matches)\(/.exec(selector);

    if (!match) return selector;

    let rewritten = false;

    for (const start of allOccurrences(selector)) {
      const open = selector.indexOf("(", start);
      const close = closingParen(selector, open);
      const [first] = splitTopLevel(selector.slice(open + 1, close), ",");
      const combinators = first ? topLevelCombinators(first) : [];

      if (!first || combinators.length === 0) continue;

      const split = combinators.at(-1)!;
      const prefix = first.slice(0, split.at + 1).trim();
      const last = first.slice(split.at + 1).trim();
      const compoundStart = topLevelCombinators(selector.slice(0, start)).at(-1);
      const head = compoundStart ? selector.slice(0, compoundStart.at + 1) : "";
      const compound = selector.slice(head.length, start) + last + selector.slice(close + 1);

      selector = `${head}${prefix} ${compound}`;
      rewritten = true;
      break;
    }
    if (!rewritten) return selector;
  }

  return selector;
};

/** Every index at which an `:is()`-family pseudo-class starts. */
const allOccurrences = (selector: string): number[] =>
  [...selector.matchAll(/:(?:is|where|matches)\(/g)].map((match) => match.index);

const closingParen = (text: string, open: number): number => {
  let depth = 0;

  for (let i = open; i < text.length; i++) {
    if (text[i] === "(") depth++;
    if (text[i] === ")" && --depth === 0) return i;
  }

  return text.length;
};

/** The index of each top-level combinator in a complex selector, with the character at it. */
export const topLevelCombinators = (selector: string): { at: number; char: string }[] => {
  const found: { at: number; char: string }[] = [];
  let depth = 0;
  let quote: string | null = null;

  for (let i = 0; i < selector.length; i++) {
    const char = selector[i]!;

    if (quote) {
      if (char === quote && selector[i - 1] !== "\\") quote = null;
      continue;
    }
    if (char === '"' || char === "'") quote = char;
    else if (char === "(" || char === "[") depth++;
    else if (char === ")" || char === "]") depth--;
    else if (depth === 0 && (char === ">" || char === "+" || char === "~" || /\s/.test(char))) {
      // Whitespace beside an explicit combinator belongs to it, not to a second one.
      const previous = found.at(-1);

      if (previous && previous.at === i - 1 && /\s/.test(char)) previous.char ||= " ";
      else found.push({ at: i, char: /\s/.test(char) ? " " : char });
    }
  }

  return found;
};

/** Reads one compound — everything between two combinators — onto `into`. */
const readCompound = (text: string, into: Compound): boolean => {
  let i = 0;

  const ident = () => {
    const start = i;

    while (i < text.length && /[\w\\-]/.test(text[i]!)) i++;

    return text.slice(start, i).replace(/\\/g, "");
  };

  const balanced = () => {
    const start = ++i; // past the opening bracket
    let depth = 1;

    while (i < text.length && depth > 0) {
      if (text[i] === "(" || text[i] === "[") depth++;
      if (text[i] === ")" || text[i] === "]") depth--;
      i++;
    }

    return text.slice(start, i - 1);
  };

  while (i < text.length) {
    const char = text[i]!;

    if (char === "*") {
      i++;
    } else if (/[a-zA-Z]/.test(char)) {
      into.tag = ident();
    } else if (char === ".") {
      i++;
      into.classes.push(ident());
    } else if (char === "#") {
      i++;
      into.attrs["id"] = ident();
    } else if (char === "[") {
      const body = balanced();
      const match = /^\s*([\w-]+)\s*(?:[~^$*|]?=\s*(.*?)\s*(?:\s[iIsS])?)?$/.exec(body);

      if (!match) return false;
      into.attrs[match[1]!] = (match[2] ?? "").replace(/^["']|["']$/g, "");
    } else if (char === ":") {
      const doubled = text[i + 1] === ":";

      i += doubled ? 2 : 1;

      const name = ident();
      const args = text[i] === "(" ? balanced() : null;

      if (doubled) {
        into.pseudoElement = `::${name}`;
        continue;
      }
      if (!readPseudoClass(name, args, into)) return false;
    } else {
      return false;
    }
  }

  return true;
};

/** Applies a pseudo-class to the compound, or reports that no markup satisfies it. */
const readPseudoClass = (name: string, args: string | null, into: Compound): boolean => {
  if (UNSATISFIABLE.test(name)) return false;

  const control = CONTROL_STATES[name];

  if (control) {
    into.tag = control.tag;
    Object.assign(into.attrs, control.attrs ?? {});

    return true;
  }

  switch (name) {
    // A subtree we build ourselves, so nothing extra is needed to be first, last or only.
    case "first-child":
    case "first-of-type":
    case "last-child":
    case "last-of-type":
    case "only-child":
    case "only-of-type":
    case "root":
    case "scope":
      return true;

    // An element is built childless unless a `:has()` on the same compound says otherwise.
    case "empty":
      return into.has.length === 0;

    case "dir":
      into.attrs["dir"] = args ?? "ltr";

      return true;

    /*
     * Whatever the rule excludes, we simply never add — except position, which a lone child has
     * by default. `:not(:first-child)` is how the middle of a button group is written, so an
     * element built without siblings lands on the wrong side of it.
     */
    case "not": {
      for (const part of splitTopLevel(args ?? "", ",")) {
        if (/^:(?:first-child|first-of-type|only-child|only-of-type)$/.test(part)) {
          into.precedingFillers = Math.max(into.precedingFillers, 1);
        }
        if (/^:(?:last-child|last-of-type|only-child|only-of-type)$/.test(part)) {
          into.followingFillers = Math.max(into.followingFillers, 1);
        }
      }

      return true;
    }

    case "is":
    case "where":
    case "matches": {
      const [first] = splitTopLevel(args ?? "", ",");

      // An alternative may itself be complex (`[data-reduce-motion=true] *`); only a lone
      // compound can be folded onto this element, and `flattenIs` is what rewrites the rest.
      // A combinator has to be looked for at the top level: this argument routinely nests
      // another `:is()` whose own alternatives are separated by spaces.
      if (!first) return true;

      return topLevelCombinators(first).length === 0 ? readCompound(first, into) : true;
    }

    case "has": {
      const [first] = splitTopLevel(args ?? "", ",");

      if (first) into.has.push(first.replace(/^[>+~]\s*/, ""));

      return true;
    }

    case "nth-child":
    case "nth-of-type": {
      const index = Number(args);

      if (!Number.isInteger(index) || index < 1) return false;
      into.precedingFillers = index - 1;

      return true;
    }

    default:
      return false;
  }
};

/** Parses one complex selector, or returns null if no markup could satisfy it. */
export const parseComplex = (selector: string): Complex | null => {
  const combinators: Combinator[] = [];
  const compounds: Compound[] = [];
  let text = "";
  let depth = 0;
  let quote: string | null = null;

  const flush = () => {
    const compound = emptyCompound();

    if (!readCompound(text, compound)) return false;
    compounds.push(compound);
    text = "";

    return true;
  };

  for (let i = 0; i < selector.length; i++) {
    const char = selector[i]!;

    // A combinator only separates compounds at the top level; `:is(.a, .b)` and `[href^=" "]`
    // both carry characters that read as one anywhere else.
    if (quote) {
      text += char;
      if (char === quote && selector[i - 1] !== "\\") quote = null;
      continue;
    }
    if (char === '"' || char === "'") quote = char;
    else if (char === "(" || char === "[") depth++;
    else if (char === ")" || char === "]") depth--;

    if (depth > 0) {
      text += char;
      continue;
    }

    const isCombinator = char === ">" || char === "+" || char === "~";

    if (!isCombinator && !/\s/.test(char)) {
      text += char;
      continue;
    }
    // Whitespace around an explicit combinator belongs to it, not to a descendant one.
    if (!text.trim()) {
      if (isCombinator && combinators.length === compounds.length - 1) combinators.push(char);
      continue;
    }
    if (!flush()) return null;

    if (isCombinator) combinators.push(char);
    else {
      // Look ahead: a descendant combinator only stands where no explicit one follows.
      const next = selector.slice(i + 1).trimStart()[0];

      if (next !== ">" && next !== "+" && next !== "~") combinators.push(" ");
    }
  }
  if (text.trim() && !flush()) return null;

  return compounds.length ? { combinators, compounds } : null;
};

const build = (compound: Compound, doc: Document): HTMLElement => {
  const el = doc.createElement(compound.tag);

  if (compound.classes.length) el.className = compound.classes.join(" ");
  for (const [name, value] of Object.entries(compound.attrs)) el.setAttribute(name, value);
  for (const argument of compound.has) {
    const subtree = synthesise(argument, doc);

    if (subtree) el.appendChild(subtree.root);
  }

  return el;
};

export interface Synthesised {
  /** The `::before` / `::after` the rule targets, if it targets one. */
  pseudoElement: string | null;
  /** The outermost node — attach this to the document. */
  root: HTMLElement;
  /** The element the selector matches. */
  target: HTMLElement;
}

/** Builds the smallest DOM that `selector` matches, or null if no markup can. */
export const synthesise = (selector: string, doc: Document): Synthesised | null => {
  const parsed = parseComplex(selector);

  if (!parsed) return null;

  const { combinators, compounds } = parsed;
  const nodes = compounds.map((compound) => build(compound, doc));
  const root = doc.createElement("div");
  let parent: HTMLElement = root;

  nodes.forEach((node, index) => {
    const combinator = index === 0 ? " " : combinators[index - 1];

    // A sibling combinator keeps the current parent and puts the previous node beside this one;
    // a descendant or child one descends into it.
    if (combinator === "+" || combinator === "~") parent = nodes[index - 1]!.parentElement!;
    else if (index > 0) parent = nodes[index - 1]!;

    for (let filler = 0; filler < compounds[index]!.precedingFillers; filler++) {
      parent.appendChild(doc.createElement("span"));
    }
    parent.appendChild(node);
    for (let filler = 0; filler < compounds[index]!.followingFillers; filler++) {
      parent.appendChild(doc.createElement("span"));
    }
  });

  return {
    pseudoElement: compounds.at(-1)!.pseudoElement,
    root,
    target: nodes.at(-1)!,
  };
};

/**
 * The first alternative in a selector list that markup can satisfy.
 *
 * A pseudo-element is dropped before the check: `matches()` answers false for every selector
 * carrying one, so the element half is what gets verified and the pseudo-element is read off the
 * verified element afterwards.
 */
export const firstSatisfiable = (selectorList: string, doc: Document): Synthesised | null => {
  for (const selector of splitTopLevel(selectorList, ",")) {
    // Built from whichever form the parser can follow; judged against the one the sheet declares.
    for (const form of new Set([selector, flattenIs(selector)])) {
      const built = synthesise(form, doc);

      if (!built) continue;

      const element = built.pseudoElement
        ? selector.slice(0, selector.lastIndexOf(built.pseudoElement)).trim()
        : selector;

      // A rule that names only a pseudo-element has no element half to verify.
      if (!element) continue;

      // The parser is not trusted; the browser's own matcher is the gate.
      if (built.target.matches(element)) return built;
    }
  }

  return null;
};
