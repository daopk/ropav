import { afterEach, describe, expect, it } from "vitest";

/**
 * The compatibility shim, as an app mid-migration gets it.
 *
 * `compat-0.10.css` aliases the palette back to the names it carried before the prefix, so an app
 * can take the release without rewriting every `var()` on the same day. It is opt-in and outside
 * the entry, which is the whole of its safety — and also the reason nothing else here would
 * notice it breaking.
 *
 * Two properties are worth a browser rather than a reader. That an alias resolves at all: the
 * shim is a file of `var()` reads, and a single wrong name on the right-hand side computes to the
 * guaranteed-invalid value with nothing logged. And that the entry alone does *not* declare the
 * bare names: if it ever did, every consumer would get the collision back whether they asked for
 * the shim or not.
 *
 * The names are read out of the shim instead of sampled, so this covers whatever it declares
 * today rather than the handful someone thought to write down — and so this file spells no bare
 * token name of its own, which is what keeps it out of `token-prefix.test.ts`'s exemptions.
 */
const bundles = import.meta.glob<string>("../../dist/ropav.min.css", {
  eager: true,
  import: "default",
  query: "?raw",
});

const shims = import.meta.glob<string>("../../../styles/dist/compat-0.10.css", {
  eager: true,
  import: "default",
  query: "?raw",
});

const css = Object.values(bundles)[0];
const shim = Object.values(shims)[0];

/** Each alias and the prefixed name behind it, as the shim pairs them. */
const pairs = [...(shim ?? "").matchAll(/(--[\w-]+):\s*var\((--rp-[\w-]+)\)/g)].map((match) => ({
  alias: match[1]!,
  token: match[2]!,
}));

const frames: HTMLIFrameElement[] = [];

/** A document wearing the given stylesheets and nothing else. */
const mount = (...sheets: string[]) => {
  const frame = document.createElement("iframe");

  document.body.appendChild(frame);
  frames.push(frame);

  const doc = frame.contentDocument as Document;

  for (const sheet of sheets) {
    const style = doc.createElement("style");

    style.textContent = sheet;
    doc.head.appendChild(style);
  }

  return (name: string) =>
    (frame.contentWindow as Window)
      .getComputedStyle(doc.documentElement)
      .getPropertyValue(name)
      .trim();
};

afterEach(() => {
  for (const frame of frames.splice(0)) frame.remove();
});

describe.skipIf(!css || !shim)("the compatibility shim", () => {
  it("pairs every alias with a prefixed name", () => {
    expect(pairs.length).toBeGreaterThan(50);
  });

  it("is absent from the entry, so nobody gets the old names unasked", () => {
    const token = mount(css as string);

    expect(pairs.filter(({ alias }) => token(alias) !== "").map(({ alias }) => alias)).toEqual([]);
  });

  it("resolves each alias to the token behind it once it is imported", () => {
    const token = mount(css as string, shim as string);

    const wrong = pairs
      .filter(({ alias, token: name }) => token(alias) === "" || token(alias) !== token(name))
      .map(
        ({ alias, token: name }) =>
          `${alias} is ${token(alias) || "(empty)"}, ${name} is ${token(name)}`,
      );

    expect(wrong).toEqual([]);
  });
});
