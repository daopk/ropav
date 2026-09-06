import type { VaporComponent } from "vue";

import { renderVapor } from "@ropav/testing/helpers/vue";
import { describe, expect, it } from "vitest";

import * as barrel from "@/components/icons";

/*
 * Read off the directory rather than the barrel, so an icon that is used without being exported
 * is audited too — `IconOverlayArrow` reached the DOM through `overlay-arrow.vue` for a long time
 * as the only one in the set carrying neither attribute, and nothing here noticed.
 */
const modules = import.meta.glob<{ default: VaporComponent }>(
  "../../../src/components/icons/*.vue",
  { eager: true },
);

const icons = Object.entries(modules).map(
  ([path, module]) => [path.slice(path.lastIndexOf("/") + 1), module.default] as const,
);

describe("icons", () => {
  /** The glob matching nothing would leave every case below passing without auditing anything. */
  it("finds one file per exported icon", () => {
    expect(icons).toHaveLength(Object.keys(barrel).length);
  });

  it.each(icons)("%s is decoration", (_name, Icon) => {
    const { container, unmount } = renderVapor(Icon);
    const svg = container.querySelector("svg")!;

    // An icon carries no meaning of its own: it sits beside the text that does. Announced, it
    // reads as an image with no description in the middle of that text.
    expect(svg.getAttribute("aria-hidden")).toBe("true");
    expect(svg.getAttribute("role")).toBe("presentation");

    unmount();
  });
});
