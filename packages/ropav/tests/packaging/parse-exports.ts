/*
 * Barrel parsing, shared by the packaging tests that police what a consumer can reach:
 * `exports.test.ts` for component directories and `composables.test.ts` for composable modules.
 *
 * It lives in one place because both leak checks have to agree on what counts as a re-export. A
 * barrel can surface a name straight through, or import it at the top and re-export it bare further
 * down — every component barrel uses the second form, because the same import also feeds the
 * compound object. A copy of this that understood only the first form would let names leak past one
 * test while the other caught them.
 */

/** `import { … } from "…"`, `export { … } from "…"`, and the bare `export { … }` in between. */
export const NAMED_STATEMENT = /(import|export)(\s+type)?\s*\{([^}]*)\}\s*(?:from\s*"([^"]+)")?/g;

/** `export * from "./name";`, capturing the name. */
const STAR_EXPORT = /^export \* from "\.\/([^"]+)";$/gm;

export interface NamedStatement {
  isExport: boolean;
  isTypeOnly: boolean;
  /** Specifiers as written, so `X as Y` survives for the alias check. */
  specifiers: string[];
  /** Empty for a bare `export { … }`, which re-exports names imported further up the file. */
  source: string;
}

export const parseStatements = (source: string): NamedStatement[] =>
  [...source.matchAll(NAMED_STATEMENT)].map((match) => ({
    isExport: match[1] === "export",
    isTypeOnly: Boolean(match[2]),
    source: match[4] ?? "",
    specifiers: (match[3] ?? "")
      .split(",")
      .map((specifier) => specifier.trim())
      .filter(Boolean),
  }));

/** The name a specifier is known by locally: `X as Y` binds `Y`, a bare `X` binds `X`. */
export const localName = (specifier: string) => specifier.split(" as ").at(-1)?.trim() ?? specifier;

/** The `export * from "./name"` lines in a barrel, in the order they appear. */
export const barrelStarExports = (source: string): string[] =>
  [...source.matchAll(STAR_EXPORT)].map((match) => match[1] ?? "");

/**
 * What a barrel re-exports out of one module, either straight through or by way of a local import.
 *
 * @param indexSource The barrel's source.
 * @param specifier The module as the barrel spells it, e.g. `../overlay` or
 *   `../../composables/use-menu-trigger`.
 * @returns Specifiers as written, so `X as Y` survives for the caller's alias check.
 */
export const reExportsFrom = (indexSource: string, specifier: string): string[] => {
  const statements = parseStatements(indexSource);
  const imported = new Set(
    statements
      .filter((statement) => !statement.isExport && statement.source === specifier)
      .flatMap((statement) => statement.specifiers.map(localName)),
  );

  return statements
    .filter((statement) => statement.isExport)
    .flatMap((statement) =>
      statement.source === specifier
        ? statement.specifiers
        : statement.source === ""
          ? statement.specifiers.filter((one) => imported.has(one.split(" as ")[0]?.trim() ?? ""))
          : [],
    );
};
