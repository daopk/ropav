import { setProjectAnnotations } from "@storybook/vue3-vite";

import { a11yAudit } from "./a11y-audit";
import { forcedColorsAudit } from "./forced-colors-audit";
import * as preview from "./preview";

/**
 * Every story, rendered the way Storybook renders it, then put through both audits.
 *
 * The project annotations are the real `preview.ts`, so stories run through the same decorators
 * and the same `vaporInteropPlugin` setup as the ones in the browser - a test that rendered them
 * some other way would not be testing what ships.
 *
 * The two audits are composed by hand rather than handed over as separate annotations, because the
 * order between them matters and `composeConfigs` is not the place to express that: the forced
 * colors pass emulates a media feature on the whole page, and axe has to run before it, while the
 * page is still painting the ordinary palette.
 */
const audit = async (context: Parameters<typeof a11yAudit>[0]) => {
  await a11yAudit(context);
  await forcedColorsAudit(context);
};

setProjectAnnotations([preview.default, { afterEach: audit }]);
