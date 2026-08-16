import {createComponent, defineVaporComponent} from "vue";

import {flattenBlock, isTextOnlyBlock} from "../../utils/block";

import BadgeLabel from "./badge-label.vue";

/**
 * Wraps a badge's bare text in `Badge.Label`, matching the React component's string and number
 * handling without executing the default slot more than once.
 *
 * The slot has already rendered by the time it returns its block. Inspecting that block therefore
 * preserves its effects and lets the exact same text nodes move into the label component.
 */
const BadgeAutoLabel = defineVaporComponent(
  (_props, {slots}) => {
    const block = slots["default"]?.();

    if (block === undefined || !isTextOnlyBlock(flattenBlock(block))) return block ?? [];

    return createComponent(BadgeLabel, null, {default: () => block});
  },
  {name: "HeroUI.Badge.AutoLabel"},
);

export default BadgeAutoLabel;
