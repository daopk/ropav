<script setup lang="ts" vapor>
import type {ComboBoxInputGroupProps, ComboBoxInputGroupSlotProps} from "./combo-box.types";

import {computed} from "vue";

import {dataAttr} from "../../utils/assertion";

import {useComboBoxContext} from "./combo-box.context";

const props = defineProps<ComboBoxInputGroupProps>();

defineSlots<{default?: (props: ComboBoxInputGroupSlotProps) => unknown}>();

const {comboBox, isDisabled, setGroupElement, slots, state} = useComboBoxContext();

/**
 * A plain wrapper, unlike the React build, where this part renders no DOM at all.
 *
 * There the group has to be rendered by the *trigger*: RAC learns its collection from a hidden
 * render pass over the children, and a host element wrapping the collection target breaks it — so
 * the container's props travel to the last child through a keyed clone channel and it renders them.
 * Vapor has no such pass, so the indirection buys nothing and this is simply the element.
 */
const setElement = (element: unknown) => {
  setGroupElement((element as HTMLElement | null) ?? null);
};

const styles = computed(() => slots.value.inputGroup({class: props.class}));

/*
 * Read here rather than in the template. A template unwraps a top-level ref, so writing
 * `isDisabled.value` there reads `.value` off a plain boolean — and the state travelling through a
 * nested ref beside it (`state.isOpen.value`) does need it, which makes the two easy to confuse.
 */
const isGroupDisabled = computed(() => isDisabled.value);
const isInvalid = computed(() => comboBox.isInvalid.value);
const isOpen = computed(() => state.isOpen.value);
</script>

<template>
  <div
    :ref="setElement"
    :class="styles"
    :data-disabled="dataAttr(isGroupDisabled)"
    :data-invalid="dataAttr(isInvalid)"
    :data-open="dataAttr(isOpen)"
    data-slot="combo-box-input-group"
    role="group"
  >
    <slot :is-disabled="isGroupDisabled" :is-invalid="isInvalid" :is-open="isOpen" />
  </div>
</template>
