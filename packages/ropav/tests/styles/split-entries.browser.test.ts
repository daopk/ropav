import { renderVapor } from "@ropav/testing/helpers/vue";
import { afterEach, describe, expect, it } from "vitest";
import { nextTick } from "vue";

import { componentCases } from "./golden/cases";
import { declaredProperties, mount, renderAll } from "./golden/render";

import indexCss from "../../../styles/components/index.css?raw";
import core from "../../../styles/core.css?inline";
import source from "@/styles.css?inline";

/**
 * The split entries render what `ropav/styles` renders.
 *
 * `ropav/styles/core`, `ropav/styles/components` and `ropav/styles/<name>` exist so an app can
 * take the core and the components it draws with its first paint, and the rest later. That only
 * works if three things hold, and each fails silently — a page that renders a little wrong:
 *
 * - **Order does not matter between component files.** An app lists its entries in whatever order
 *   it likes, and a later load appends. If one file only wins over another by coming after it,
 *   some app will put them the other way round.
 * - **A late full copy changes nothing.** The components half arriving after the first paint
 *   restates rules the page already has, after rules it already has. It must land on the same
 *   result as having had the whole sheet from the start.
 * - **An entry carries what its component draws.** An app that imports the entries of the
 *   components it uses must see them styled as the full sheet styles them.
 */

/** The component files by name, unresolved: none imports anything. */
const files = Object.fromEntries(
  Object.entries(
    import.meta.glob<string>("../../../styles/components/*.css", {
      eager: true,
      import: "default",
      query: "?raw",
    }),
  ).map(([file, css]) => [file.split("/").pop()!.replace(".css", ""), css]),
);

/** The full sheet's order. */
const ORDER = [...indexCss.matchAll(/^@import "\.\/([a-z0-9-]+)\.css";/gm)].map(
  ([, name]) => name!,
);

/** The core, then `names` in the `components` layer, in the order given. */
const sheet = (names: string[]) =>
  `${core}\n${names.map((name) => `@layer components {\n${files[name]}\n}`).join("\n")}`;

/** A handful of components already on the page, listed as an app might: not in the sheet's order. */
const ALREADY_LOADED = [
  "modal",
  "close-button",
  "list-box",
  "virtualizer",
  "list-box-item",
  "switch",
  "button",
  "label",
];

const documents: Document[] = [];

afterEach(() => {
  for (const doc of documents.splice(0)) doc.defaultView!.frameElement!.remove();
});

/** Every golden case, rendered in a document carrying each sheet; the properties that differ. */
const compareCases = (left: string, right: string) => {
  const one = mount(left);
  const two = mount(right);

  documents.push(one, two);

  const cases = componentCases(one.styleSheets);
  const properties = declaredProperties(one.styleSheets).filter((name) => !name.startsWith("--"));
  const a = renderAll(cases, ["light", "dark"], one);
  const b = renderAll(cases, ["light", "dark"], two);
  const differing: string[] = [];
  let compared = 0;

  for (const mode of ["light", "dark"] as const) {
    for (const [id, l] of a.rendered.get(mode)!) {
      const r = b.rendered.get(mode)!.get(id);

      if (!r) continue;
      compared++;

      const from = one.defaultView!.getComputedStyle(l.target, l.pseudoElement);
      const to = two.defaultView!.getComputedStyle(r.target, r.pseudoElement);

      for (const property of properties) {
        const was = from.getPropertyValue(property);
        const is = to.getPropertyValue(property);

        if (was !== is) differing.push(`${mode} ${id.slice(0, 90)} | ${property}: ${was} -> ${is}`);
      }
    }
  }

  return { compared, differing };
};

describe("the component files", () => {
  it("render the same in reverse order", () => {
    const { compared, differing } = compareCases(sheet(ORDER), sheet([...ORDER].reverse()));

    expect({ differing: differing.slice(0, 20), ran: compared > 0 }).toEqual({
      differing: [],
      ran: true,
    });
  });

  it("render the same when the full set arrives after a subset already on the page", () => {
    const late = `${sheet(ALREADY_LOADED)}\n${ORDER.map((name) => `@layer components {\n${files[name]}\n}`).join("\n")}`;
    const { compared, differing } = compareCases(sheet(ORDER), late);

    expect({ differing: differing.slice(0, 20), ran: compared > 0 }).toEqual({
      differing: [],
      ran: true,
    });
  });
});

/*
 * The built entries, which only exist after a build — skipped without one, like the compiled
 * stylesheet's parity check. Vite resolves each one's `@ropav/styles/components/*.css` imports
 * through the package's `style` condition, as an app's build would.
 */
const entries = Object.fromEntries(
  Object.entries(
    import.meta.glob<string>("../../dist/styles/*.css", {
      eager: true,
      import: "default",
      query: "?inline",
    }),
  ).map(([file, css]) => [file.split("/").pop()!.replace(".css", ""), css]),
);

const fixtures = import.meta.glob("../components/*/fixtures.vue", {
  eager: true,
  import: "default",
});
const fixtureSources = import.meta.glob<string>("../components/*/fixtures.vue", {
  eager: true,
  import: "default",
  query: "?raw",
});

/** The props a fixture cannot mount without, as its own tests pass them. */
const REQUIRED_PROPS: Record<string, Record<string, unknown>> = {
  "color-slider": { channel: "hue", defaultValue: "hsl(0, 100%, 50%)" },
};

/** What a fixture draws, overlays included: they portal to `body`, outside the container. */
const markupOf = async (fixture: unknown, props: Record<string, unknown>) => {
  const before = new Set(document.body.children);
  const { container, unmount } = renderVapor(fixture as never, { props });

  await nextTick();
  await nextTick();

  const html = [...document.body.children]
    .filter((child) => child === container || !before.has(child))
    .map((child) => child.outerHTML)
    .join("");

  unmount();

  return html;
};

/** Every element's resolved style, keyed by its place in the tree. */
const readTree = (doc: Document, properties: string[]) => {
  const view = doc.defaultView!;

  return [...doc.body.querySelectorAll("*")].map((element, index) => {
    const style = view.getComputedStyle(element);
    const label = `${index} ${element.tagName.toLowerCase()}.${[...element.classList].join(".")}`;

    return [
      label,
      Object.fromEntries(properties.map((name) => [name, style.getPropertyValue(name)])),
    ];
  });
};

describe.skipIf(Object.keys(entries).length === 0)("each component's entry", () => {
  const cases = Object.entries(fixtures)
    .map(([file, fixture]) => {
      const name = file.split("/").at(-2)!;
      const used = [
        ...new Set(
          [...fixtureSources[file]!.matchAll(/from "@\/components\/([a-z0-9-]+)"/g)].map(
            ([, dir]) => dir!,
          ),
        ),
      ].filter((dir) => dir in entries);

      return { fixture, name, opens: fixtureSources[file]!.includes("defaultOpen"), used };
    })
    .filter(({ used }) => used.length > 0);

  it.each(cases)(
    "styles $name's fixture as the full sheet does, from core and its components' entries",
    async ({ fixture, name, opens, used }) => {
      const html = await markupOf(fixture, {
        ...REQUIRED_PROPS[name],
        ...(opens ? { defaultOpen: true } : {}),
      });

      /** The fixture's markup in a document of its own carrying `css`, read back. */
      const read = (css: string) => {
        const doc = mount(css);

        documents.push(doc);
        doc.body.innerHTML = html;

        return doc;
      };

      const full = read(source);
      const properties = declaredProperties(full.styleSheets).filter(
        (property) => !property.startsWith("--"),
      );
      const want = readTree(full, properties);

      /** Every element whose resolved style differs from the full sheet's. */
      const differing = (doc: Document) => {
        const got = readTree(doc, properties);

        return want.flatMap(([label, style], index) =>
          Object.entries(style as Record<string, string>)
            .filter(
              ([property, value]) => (got[index]![1] as Record<string, string>)[property] !== value,
            )
            .map(
              ([property, value]) =>
                `${label as string} | ${property}: ${value} -> ${(got[index]![1] as Record<string, string>)[property]}`,
            ),
        );
      };

      // Against the full sheet's own order rather than `source`, which also carries the override
      // block: real markup puts classes together that no single rule names, which the golden
      // cases above cannot reach.
      const canonical = readTree(read(sheet(ORDER)), properties);
      const reversed = readTree(read(sheet([...ORDER].reverse())), properties);
      const flipped = canonical.flatMap(([label, style], index) =>
        Object.entries(style as Record<string, string>)
          .filter(
            ([property, value]) =>
              (reversed[index]![1] as Record<string, string>)[property] !== value,
          )
          .map(([property]) => `${label as string} | ${property}`),
      );

      expect({
        elements: want.length > 0,
        "from its entries": differing(
          read(`${entries["core"]}\n${used.map((dir) => entries[dir]).join("\n")}`),
        ).slice(0, 12),
        "in reverse order": flipped.slice(0, 12),
      }).toEqual({ elements: true, "from its entries": [], "in reverse order": [] });
    },
  );
});
