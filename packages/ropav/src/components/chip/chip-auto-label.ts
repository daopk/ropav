import { createAutoLabel } from "../../utils/auto-label";

import ChipLabel from "./chip-label.vue";

/**
 * Wraps a chip's bare text in `ChipLabel`, so that `<Chip>Label</Chip>` and
 * `<Chip><ChipLabel>Label</ChipLabel></Chip>` produce the same DOM.
 */
const ChipAutoLabel = createAutoLabel(ChipLabel, "Ropav.Chip.AutoLabel");

export default ChipAutoLabel;
