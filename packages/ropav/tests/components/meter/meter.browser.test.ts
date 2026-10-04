import { PALETTE_CONTRAST_DEBT, expectNoA11yViolations } from "@ropav/testing/helpers/a11y";
import { renderVapor } from "@ropav/testing/helpers/vue";
import { describe, expect, it } from "vitest";
import { nextTick } from "vue";

import Fixture from "./fixtures.vue";

/**
 * What axe makes of the meter's role.
 *
 * The root used to carry `role="meter progressbar"`, a fallback role list. axe does not read those:
 * it takes the whole string as one unknown role, falls back to the `div`'s implicit role, and then
 * flags every `aria-value*` attribute as not allowed - a critical `aria-allowed-attr` on any page
 * that rendered a meter. A single `meter` role is what every current browser and screen reader
 * understands, and the case below is the one that fails on the old markup.
 */
describe("Meter (browser)", () => {
  it("has no axe violations", async () => {
    const { container, unmount } = renderVapor(Fixture, { props: { value: 60 } });

    await nextTick();

    // The accent pair is palette debt, named in one place rather than switched off inline.
    await expectNoA11yViolations(container, PALETTE_CONTRAST_DEBT);
    expect(container.querySelector('[data-slot="meter"]')).toHaveAttribute("role", "meter");

    unmount();
  });
});
