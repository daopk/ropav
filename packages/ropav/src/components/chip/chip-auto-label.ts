import {createComponent, defineVaporComponent} from "vue";

import {flattenBlock, isTextOnlyBlock} from "../../utils/block";

import ChipLabel from "./chip-label.vue";

/**
 * Renders the chip's children, wrapping them in `Chip.Label` when they are only text.
 *
 * The point is that `<Chip>Label</Chip>` and `<Chip><Chip.Label>Label</Chip.Label></Chip>`
 * produce the same DOM. A template cannot ask whether its children are bare text, but a slot
 * function can be answered: it returns
 * the block it just rendered, and a lone text child resolves to a single text node while
 * markup resolves to elements or component instances.
 *
 * The slot is called exactly once and the very block it returns is what gets inserted, so
 * nothing is rendered twice and no effect is registered and thrown away — which is the
 * actual hazard with slots in Vapor, rather than reading them at all.
 *
 * Written as a Vapor component rather than an SFC because only a hand-written `setup` gets
 * to hold the block; an SFC's `<slot />` is inserted before there is anywhere to intervene.
 */
const ChipAutoLabel = defineVaporComponent(
  (_props, {slots}) => {
    const block = slots["default"]?.();

    if (block === undefined || !isTextOnlyBlock(flattenBlock(block))) return block ?? [];

    return createComponent(ChipLabel, null, {default: () => block});
  },
  {name: "HeroUI.Chip.AutoLabel"},
);

export default ChipAutoLabel;
