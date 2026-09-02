<script setup lang="ts" vapor>
import type { CollectionKey } from "../../composables/use-collection";
import type {
  SegmentedControlOrientation,
  SegmentedControlRootProps,
  SegmentedControlRootSlotProps,
} from "./segmented-control.types";

import { segmentedControlVariants } from "@ropav/styles";
import { computed, shallowRef } from "vue";

import { useListKeyboard } from "../../composables/use-list-keyboard";
import {
  createSharedElementScope,
  provideSharedElementScope,
} from "../../composables/use-shared-element";
import { useSingleSelectListState } from "../../composables/use-single-select-list-state";
import { dataAttr } from "../../utils/assertion";

import { provideSegmentedControlContext } from "./segmented-control.context";

// The three-state props declare an explicit `undefined` default, so an absent prop stays absent
// rather than being cast to `false` and read as a caller's decision.
const props = withDefaults(defineProps<SegmentedControlRootProps>(), {
  fullWidth: undefined,
  isDisabled: undefined,
  size: undefined,
});

const emit = defineEmits<{
  selectionChange: [key: CollectionKey];
  "update:selectedKey": [key: CollectionKey];
}>();

defineSlots<{ default?: (props: SegmentedControlRootSlotProps) => unknown }>();

/*
 * Named rather than written inline at each use, so a vertical orientation stays a matter of
 * where this value comes from. The keyboard, the aria attribute and the data attribute all read
 * it, and none of them would need touching.
 */
const orientation = computed<SegmentedControlOrientation>(() => "horizontal");

const isDisabled = computed(() => Boolean(props.isDisabled));

const slots = computed(() =>
  segmentedControlVariants({ fullWidth: props.fullWidth, size: props.size }),
);

const state = useSingleSelectListState({
  defaultSelectedKey: props.defaultSelectedKey,
  disabledKeys: () => props.disabledKeys,
  isDisabled: () => props.isDisabled,
  onSelectionChange: (key) => {
    props.onSelectionChange?.(key);
    emit("selectionChange", key);
    emit("update:selectedKey", key);
  },
  selectedKey: () => props.selectedKey,
});

const element = shallowRef<HTMLElement | null>(null);

const keyboard = useListKeyboard({
  collection: state.collection,
  // Enter and Space belong to the segment's own press, which is where React Aria puts them too.
  disallowActivation: true,
  element,
  /*
   * A segmented control always has exactly one segment selected, so there is no empty selection
   * for Escape to leave behind — and claiming the key would swallow the Escape meant for
   * whatever the control sits inside.
   */
  escapeKeyBehavior: "none",
  layout: "stack",
  orientation: () => orientation.value,
  selection: state.selection,
  // Moving between segments chooses as it goes, which is the radio group keyboard model. Unlike
  // a tab list there is no manual mode to offer: a radio group has only the one behaviour.
  selectOnFocus: true,
  shouldFocusWrap: true,
});

/**
 * The keys a segmented control has no answer for.
 *
 * It has no notion of a page, and the delegate would answer PageUp and PageDown by jumping to an
 * end — surprising, and a scroll the page should have had.
 *
 * The block arrows are deliberately not filtered, which is the one place this parts company with
 * `tabs-list.vue`. A radio group answers all four arrows whatever its axis, and a horizontal
 * stack already routes ArrowDown to the next key and ArrowUp to the previous.
 */
const onKeydown = (event: KeyboardEvent) => {
  if (event.key === "PageUp" || event.key === "PageDown") return;

  keyboard.onKeydown(event);
};

/*
 * One scope per control, which is the same thing as one per selection: the indicator is handed
 * from the segment losing the selection to the segment gaining it.
 */
provideSharedElementScope(createSharedElementScope());

provideSegmentedControlContext({ isDisabled, keyboard, slots, state });
</script>

<template>
  <div
    ref="element"
    :aria-describedby="props.ariaDescribedby"
    :aria-disabled="isDisabled || undefined"
    :aria-label="props.ariaLabel"
    :aria-labelledby="props.ariaLabelledby"
    :aria-orientation="orientation"
    :class="slots.base({ class: props.class })"
    :data-disabled="dataAttr(isDisabled)"
    :data-orientation="orientation"
    data-slot="segmented-control"
    role="radiogroup"
    @focusin="keyboard.onFocusin"
    @focusout="keyboard.onFocusout"
    @keydown="onKeydown"
  >
    <slot :is-disabled="isDisabled" :selected-key="state.selectedKey.value" />
  </div>
</template>
