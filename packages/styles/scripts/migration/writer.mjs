/**
 * Puts the expansion back where the `@apply` was, and touches nothing else in the file.
 *
 * These stylesheets are more comment than declaration, and the comments are the reason anyone can
 * read them: which of two `:has()` selectors is load-bearing, why a rule sits in the layer it
 * sits in, what breaks if a value moves. A round-trip through any CSS printer keeps the rules and
 * loses the argument, so nothing here parses the file. Each statement's byte range is replaced,
 * back to front so earlier offsets stay valid, and every other byte is the byte that was there.
 */

/** Re-indents a generated block to sit where the statement it replaces sat. */
const reindent = (css, indent) => {
  const lines = css
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  let depth = 0;

  return lines
    .map((line) => {
      if (line.startsWith("}")) depth--;

      const out = `${indent}${"  ".repeat(Math.max(depth, 0))}${line}`;

      if (line.endsWith("{")) depth++;

      return out;
    })
    .join("\n");
};

/**
 * A declaration list needs its final semicolon back.
 *
 * The oracle hands over what a rule body held, and a printer leaves the last declaration bare
 * because a closing brace followed it. Here a hand-written declaration may follow instead.
 */
const terminated = (css) => (/[;}]\s*$/.test(css) ? css : `${css};`);

/**
 * Rewrites one file.
 *
 * `expandedFor` returns the CSS a list stands for, or null to leave that statement alone — which
 * is how a utility that is staying as a class of its own opts out.
 *
 * `renameSlots` then goes over whatever the author wrote by hand. Two components override the
 * focus ring by declaring `--tw-ring-offset-width: 0px` on its own, with nothing beside it: the
 * declaration that reads the slot lives in the `@apply` above. Renaming only the generated half
 * leaves the override writing a name nobody reads any more, and the ring silently grows by its
 * offset — a change no diff of the compiled declarations can see, because the same normalisation
 * that lets the two sides be compared is what erases the difference.
 */
export const rewrite = (source, statements, expandedFor, renameSlots) => {
  let out = source;
  let replaced = 0;

  for (const statement of [...statements].reverse()) {
    const expansion = expandedFor(statement.list);

    if (expansion === null) continue;

    out =
      out.slice(0, statement.start) +
      terminated(reindent(expansion, statement.indent)) +
      out.slice(statement.end);
    replaced++;
  }

  return { css: renameSlots(out), replaced };
};
