import { createAutoLabel } from "../../utils/auto-label";

import BadgeLabel from "./badge-label.vue";

/** Wraps a badge's bare text in `BadgeLabel`. */
const BadgeAutoLabel = createAutoLabel(BadgeLabel, "Ropav.Badge.AutoLabel");

export default BadgeAutoLabel;
