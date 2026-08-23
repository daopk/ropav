/**
 * @see https://github.com/lint-staged/lint-staged#configuration
 *
 * oxlint runs first so its fixes (type imports, unused vars, key ordering) land
 * before oxfmt has the final say on layout and import sorting.
 */
const lintStaged = {
  "**/*.{cjs,mjs,js,ts,vue}": ["oxlint --fix --max-warnings=0", "oxfmt"],
  "**/*.{css,html,json,jsonc,yaml,yml}": ["oxfmt"],
};

export default lintStaged;
