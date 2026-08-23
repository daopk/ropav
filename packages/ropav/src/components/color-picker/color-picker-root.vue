<script setup lang="ts" vapor>
import type {ColorPickerRootProps, ColorPickerRootSlotProps} from "./color-picker.types";
import type {Color} from "../../utils/color-types";

import {colorPickerVariants} from "@heroui/styles";
import {computed} from "vue";

import {providePressResponder} from "../../composables/press-responder";
import {useColorPickerState} from "../../composables/use-color-picker-state";
import {useDialogTrigger} from "../../composables/use-dialog-trigger";
import {useOverlayTriggerState} from "../../composables/use-overlay-trigger-state";
import {provideOverlayTargetContext} from "../overlay";

import {provideColorPickerContext, provideColorValueContext} from "./color-picker.context";

// `isOpen` declares an explicit `undefined` default, which is what distinguishes an uncontrolled
// picker from one a caller is holding closed.
const props = withDefaults(defineProps<ColorPickerRootProps>(), {isOpen: undefined});

const emit = defineEmits<{
  change: [value: Color];
  "update:value": [value: Color];
  openChange: [isOpen: boolean];
  "update:isOpen": [isOpen: boolean];
}>();

defineSlots<{default?: (props: ColorPickerRootSlotProps) => unknown}>();

const state = useColorPickerState({
  defaultValue: () => props.defaultValue,
  onChange: (value) => {
    emit("change", value);
    emit("update:value", value);
  },
  value: () => props.value,
});

const overlay = useOverlayTriggerState({
  defaultOpen: props.defaultOpen,
  isOpen: () => props.isOpen,
  onOpenChange: (isOpen) => {
    emit("openChange", isOpen);
    emit("update:isOpen", isOpen);
  },
});

const trigger = useDialogTrigger({}, overlay);

// The trigger is whatever pressable sits inside, matching the popover layer: React wraps the
// picker's contents in a `DialogTrigger`, which hands the press down the same way.
providePressResponder(trigger.responder);

provideColorPickerContext({slots: computed(() => colorPickerVariants())});

/**
 * The one context every colour component under here reads.
 *
 * React fans the same state into six RAC contexts; the precedence both have to end up with is
 * documented on `ColorValueContext`.
 */
provideColorValueContext({
  setValue: state.setColor,
  value: state.color,
});

provideOverlayTargetContext({
  // A dialog has no direction to carry into it, unlike a menu opened with an arrow key.
  autoFocus: computed(() => false),
  closeAll: overlay.close,
  // Both ids are the same one: the dialog *is* the content, so there is nothing else to name.
  dialogId: trigger.overlayId,
  isNonModal: false,
  labelledBy: trigger.triggerId,
  overlayId: trigger.overlayId,
  placement: "bottom left",
  state: overlay,
  trigger: "DialogTrigger",
  triggerElement: trigger.triggerElement,
});

const styles = computed(() => colorPickerVariants().base({class: props.class}));
</script>

<template>
  <div :class="styles" data-slot="color-picker">
    <slot :color="state.color.value" />
  </div>
</template>
