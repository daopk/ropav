import { setProjectAnnotations } from "@storybook/vue3-vite";

import { forcedColorsAudit } from "./forced-colors-audit";
import * as preview from "./preview";

/**
 * Every story, rendered the way Storybook renders it, then audited under Forced Colors Mode.
 *
 * The project annotations are the real `preview.ts`, so stories run through the same decorators
 * and the same `vaporInteropPlugin` setup as the ones in the browser - a test that rendered them
 * some other way would not be testing what ships.
 */
setProjectAnnotations([preview.default, { afterEach: forcedColorsAudit }]);
