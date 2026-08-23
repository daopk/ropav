<script setup lang="ts" vapor>
import type { TabsTabProps, TabsTabSlotProps } from "./tabs.types";

import { computed, shallowRef, watch } from "vue";

import { useInteractionStates } from "../../composables/use-interaction-states";
import { dataAttr } from "../../utils/assertion";
import { getCollectionTextValue } from "../../utils/text-value";

import { provideTabsTabContext, useTabsContext } from "./tabs.context";

const props = withDefaults(defineProps<TabsTabProps>(), { isDisabled: undefined });

defineSlots<{ default?: (props: TabsTabSlotProps) => unknown }>();

const { isDisabled: isListDisabled, keyboard, slots, state } = useTabsContext();

const tabKey = computed(() => props.id);

const element = shallowRef<HTMLElement | null>(null);

/*
 * Registration happens in a watcher rather than in the template ref: the collection bumps a
 * counter as it registers, and an increment reads before it writes — so registering from inside
 * a tracked scope would make that scope depend on the counter it just changed.
 */
watch(
  element,
  (current, _previous, onCleanup) => {
    if (!current) return;

    onCleanup(
      state.collection.register(tabKey.value, {
        element: () => element.value,
        isDisabled: () => Boolean(props.isDisabled),
        textValue: () => props.textValue ?? getCollectionTextValue(element.value),
      }),
    );
  },
  { flush: "post", immediate: true },
);

const isSelected = computed(() => state.selectedKey.value === tabKey.value);
const isDisabled = computed(() => isListDisabled.value || state.selection.isDisabled(tabKey.value));

const {
  isFocusVisible,
  isFocused,
  isHovered,
  isPressed,
  onBlur,
  onFocus,
  onPointerdown: onPointerdownState,
  onPointerenter,
  onPointerleave,
} = useInteractionStates({ isDisabled: () => isDisabled.value });

provideTabsTabContext({ isSelected });

/*
 * A tab is chosen as the press begins, not as it ends, which is what React Aria does for a tab
 * that is not a link. The collection is told to leave Enter and Space alone for the same reason,
 * so they are answered here.
 */
const choose = () => {
  if (isDisabled.value) return;

  keyboard.focusKey(tabKey.value);
  state.selection.replaceSelection(tabKey.value);
};

const onPointerdown = (event: PointerEvent) => {
  onPointerdownState(event);
  if (event.button !== 0) return;

  choose();
};

const onKeydown = (event: KeyboardEvent) => {
  if (event.key !== "Enter" && event.key !== " ") return;

  event.preventDefault();
  event.stopPropagation();
  choose();
};
</script>

<template>
  <div
    :id="state.tabId(tabKey)"
    ref="element"
    :aria-controls="isSelected ? state.tabPanelId(tabKey) : undefined"
    :aria-disabled="isDisabled || undefined"
    :aria-selected="isSelected"
    :class="slots.tab({ class: props.class })"
    :data-disabled="dataAttr(isDisabled)"
    :data-focus-visible="dataAttr(isFocusVisible)"
    :data-focused="dataAttr(isFocused)"
    :data-hovered="dataAttr(isHovered)"
    :data-key="tabKey"
    :data-pressed="dataAttr(isPressed)"
    :data-selected="dataAttr(isSelected)"
    data-slot="tabs-tab"
    role="tab"
    :tabindex="isDisabled ? undefined : keyboard.itemTabIndex(tabKey)"
    @blur="onBlur"
    @focus="onFocus"
    @keydown="onKeydown"
    @pointerdown="onPointerdown"
    @pointerenter="onPointerenter"
    @pointerleave="onPointerleave"
  >
    <slot
      :is-disabled="isDisabled"
      :is-focus-visible="isFocusVisible"
      :is-focused="isFocused"
      :is-hovered="isHovered"
      :is-pressed="isPressed"
      :is-selected="isSelected"
    />
  </div>
</template>
