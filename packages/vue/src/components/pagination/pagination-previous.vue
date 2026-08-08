<script setup lang="ts" vapor>
import type {PaginationLinkSlotProps, PaginationPreviousProps} from "./pagination.types";

import {computed} from "vue";

import {useInteractionStates} from "../../composables/use-interaction-states";
import {dataAttr} from "../../utils/assertion";

import {usePaginationContext} from "./pagination.context";

const props = withDefaults(defineProps<PaginationPreviousProps>(), {type: "button"});

const emit = defineEmits<{click: [event: MouseEvent]}>();

defineSlots<{default?: (props: PaginationLinkSlotProps) => unknown}>();

const {slots} = usePaginationContext();

// The stylesheet keys hover, press and focus on these attributes rather than on the native
// pseudo-classes, and the focus ring is only reachable through `data-focus-visible`.
const {
  isFocusVisible,
  isHovered,
  isPressed,
  onBlur,
  onFocus,
  onPointerdown,
  onPointerenter,
  onPointerleave,
} = useInteractionStates({isDisabled: () => props.isDisabled});

// Written even though a native button is already tabbable: Safari does not focus one unless
// an explicit tab index says so, which is why react-aria always sets it.
const tabindex = computed(() => (props.isDisabled ? undefined : 0));
</script>

<template>
  <button
    :class="slots.link({class: ['pagination__link--nav', props.class]})"
    :data-focus-visible="dataAttr(isFocusVisible)"
    :data-hovered="dataAttr(isHovered)"
    :data-pressed="dataAttr(isPressed)"
    data-slot="pagination-previous"
    :disabled="props.isDisabled || undefined"
    :tabindex="tabindex"
    :type="props.type"
    @blur="onBlur"
    @click="emit('click', $event)"
    @focus="onFocus"
    @pointerdown="onPointerdown"
    @pointerenter="onPointerenter"
    @pointerleave="onPointerleave"
  >
    <slot
      :is-disabled="Boolean(props.isDisabled)"
      :is-focus-visible="isFocusVisible"
      :is-hovered="isHovered"
      :is-pressed="isPressed"
    />
  </button>
</template>
