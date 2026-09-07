/**
 * Turns Tailwind's output into CSS this package can own, without changing what it computes to.
 *
 * Tailwind emits *composable* declarations: a width arrives as `border-top-style:
 * var(--tw-border-style); border-top-width: 0`, a ring as a five-slot `box-shadow` over six
 * `--tw-ring-*` variables. Those slots look like scaffolding, and the tempting move is to fold
 * them away — `--tw-leading: 1.43; line-height: var(--tw-leading, …)` really does mean
 * `line-height: 1.43`, for that one rule.
 *
 * It is the wrong move here, and the reason is the cascade. A slot is how two rules that both
 * match an element combine: one sets `--tw-leading`, another declares the `line-height` that
 * reads it, and folding either into a literal silently drops the other's contribution. The
 * failure is invisible in the rule being edited and shows up in a state nobody was looking at.
 *
 * So the table has three entries, and all three are mechanical:
 *
 * 1. **Drop** a slot nothing reads. Written and never read is not composition, it is residue —
 *    Tailwind emits `--tw-font-weight` beside the `font-weight` it already spelled out.
 * 2. **Rename** every slot both of whose ends are ours. The machinery stays exactly as it is and
 *    stops being Tailwind's. Simplifying a group is a change of behaviour, and belongs to the
 *    step that owns it — the ring to its own, the animations to theirs.
 * 3. **Leave alone** a slot read by a stylesheet this package does not write. Renaming the write
 *    while a third party goes on reading the old name is not a rename, it is a disconnection.
 *
 * Which slots fall in which set is not written down here; `corpus.mjs` reads it off the corpus.
 */

/** The prefix the slots move to, so nothing in the output still spells a vendor's name. */
export const PREFIX = "--rp-";

const renamed = (text, defer) =>
  text.replaceAll(/--tw-[\w-]+/g, (name) =>
    defer.has(name) ? name : name.replace("--tw-", PREFIX),
  );

/**
 * Applies the table to one expansion.
 *
 * Works on the CSS text rather than an AST: the input is machine-generated and single-purpose,
 * the two operations are a line filter and a rename, and the output is about to be re-indented
 * and spliced into a hand-written file anyway.
 */
export const normalise = (css, { defer = new Set(), drop }) =>
  renamed(
    css
      .split("\n")
      .filter((line) => {
        const declared = /^\s*(--tw-[\w-]+)\s*:/.exec(line);

        return !declared || !drop.has(declared[1]);
      })
      .join("\n"),
    defer,
  );

/**
 * The table's rename, applied to CSS a person wrote rather than to an expansion.
 *
 * Two components override the focus ring by declaring `--tw-ring-offset-width: 0px` on its own,
 * with nothing beside it — the declaration that reads the slot came from the `@apply` above.
 * Renaming only the generated half leaves the override writing a name nobody reads.
 */
export const renameSlots = (css, { defer = new Set() } = {}) => renamed(css, defer);

/**
 * The `@property` blocks the renamed slots need, taken from the ones Tailwind ships.
 *
 * Only the renamed ones. A deferred slot still answers to its old name, which Tailwind is still
 * registering, and registering it twice under two names would leave two independent slots where
 * the composition needs one.
 */
export const propertyBlocks = (compiled, rename) => {
  const blocks = [];

  for (const match of compiled.matchAll(/@property\s+(--tw-[\w-]+)\s*\{[^}]*\}/g)) {
    if (rename.has(match[1])) blocks.push(renamed(match[0], new Set()));
  }

  return blocks;
};
