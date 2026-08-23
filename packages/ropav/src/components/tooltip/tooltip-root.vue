<script setup lang="ts" vapor>
import type {TooltipRootProps} from "./tooltip.types";

import {tooltipVariants} from "@heroui/styles";
import {computed} from "vue";

import {provideFocusResponder} from "../../composables/focus-responder";
import {useCssVariable} from "../../composables/use-css-variable";
import {useTooltipTrigger} from "../../composables/use-tooltip-trigger";
import {useTooltipTriggerState} from "../../composables/use-tooltip-trigger-state";
import {parseCssTime} from "../../utils/css";

import {provideTooltipContext} from "./tooltip.context";

// The three-state booleans declare an explicit `undefined` default: a `false` Vue had cast would
// turn the tooltip controlled, or read as a deliberate opt-out of closing on press.
const props = withDefaults(defineProps<TooltipRootProps>(), {
  isOpen: undefined,
  shouldCloseOnPress: undefined,
  shouldSkipAnimation: false,
});

const emit = defineEmits<{
  openChange: [isOpen: boolean];
  "update:isOpen": [isOpen: boolean];
}>();

defineSlots<{default?: () => unknown}>();

/**
 * The timings come from the stylesheet, not from a number written here.
 *
 * They belong to the theme rather than to the component, so a product wanting faster tooltips
 * changes one declaration instead of every call site. A prop still wins, and the built-in defaults
 * are the floor when the property is not declared at all.
 */
const cssDelay = useCssVariable("--tooltip-delay");
const cssCloseDelay = useCssVariable("--tooltip-close-delay");

const state = useTooltipTriggerState({
  closeDelay: () => props.closeDelay ?? parseCssTime(cssCloseDelay.value),
  defaultOpen: props.defaultOpen,
  delay: () => props.delay ?? parseCssTime(cssDelay.value),
  isOpen: () => props.isOpen,
  onOpenChange: (isOpen) => {
    emit("openChange", isOpen);
    emit("update:isOpen", isOpen);
  },
});

const trigger = useTooltipTrigger(
  {
    isDisabled: () => props.isDisabled,
    shouldCloseOnPress: () => props.shouldCloseOnPress,
    trigger: () => props.trigger,
  },
  state,
);

/**
 * The trigger is whatever focusable sits inside, which is why the behaviour is handed down.
 *
 * `<Tooltip><Button/></Tooltip>` is the common case, and `Tooltip.Trigger` exists for markup that
 * is not focusable on its own. Deliberately a different channel from the press responder: a button
 * inside a dropdown already takes its press from above, and a tooltip around it has to add to that
 * rather than replace it.
 */
provideFocusResponder(trigger.responder);

provideTooltipContext({
  // React Aria reports this while its shared warmup timer runs, which makes a tooltip replacing
  // another one appear with no fade. Erased here unless the caller asks for it back.
  shouldSkipAnimation: computed(() =>
    props.shouldSkipAnimation ? state.shouldSkipAnimation.value : false,
  ),
  slots: computed(() => tooltipVariants()),
  state,
  tooltipId: trigger.tooltipId,
  triggerElement: trigger.triggerElement,
});
</script>

<template>
  <slot />
</template>
