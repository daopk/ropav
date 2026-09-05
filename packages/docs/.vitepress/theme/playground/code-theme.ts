/**
 * The contrast corrections the site's own build applies, restated so the client can apply the
 * same ones. They are not merged into the theme's defaults but spread over them at the top
 * level, so passing a theme's key replaces its object outright — these are those defaults plus
 * nothing, kept here so one constant drives both sides and a repainted block cannot drift.
 */
export const colorReplacements = {
  "github-dark": {
    "#2188ff": "#268bf9",
    "#586069": "#5b93a3",
    "#6a737d": "#818e99",
    "#ea4a5a": "#ef5564",
  },
  "github-light": {
    "#0366d6": "#0663d0",
    "#1b7c83": "#06747a",
    "#22863a": "#11782a",
    "#28a745": "#0e790b",
    "#3192aa": "#05728b",
    "#6a737d": "#62687b",
    "#959da5": "#6c676f",
    "#b08800": "#846312",
    "#cb2431": "#c82430",
    "#d73a49": "#c62739",
    "#e36209": "#c13617",
  },
};

/*
 * Light first, against the linter: the class list a block carries is written in this order,
 * and the site's own build passes light first. Nothing reads those classes — the stylesheet
 * goes through the custom properties — but a block repainted here should match the ones
 * around it exactly, not merely behave the same.
 */
// oxlint-disable-next-line sort-keys
export const themes = { light: "github-light", dark: "github-dark" } as const;
