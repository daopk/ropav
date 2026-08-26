<script setup lang="ts" vapor>
import type { TabsPanelProps, TabsPanelSlotProps } from "./tabs.types";

import { computed, shallowRef, watch } from "vue";

import { useEnterExit } from "../../composables/use-enter-exit";
import { useInteractionStates } from "../../composables/use-interaction-states";
import { dataAttr } from "../../utils/assertion";

import { useTabsContext } from "./tabs.context";

const props = withDefaults(defineProps<TabsPanelProps>(), { shouldForceMount: undefined });

defineSlots<{ default?: (props: TabsPanelSlotProps) => unknown }>();

const { slots, state } = useTabsContext();

const panelKey = computed(() => props.id);

const isSelected = computed(() => state.selectedKey.value === panelKey.value);

// Registered while mounted so a tab knows whether its `aria-controls` has anything to point at.
watch(
  panelKey,
  (key, _previous, onCleanup) => {
    if (key == null) return;
    onCleanup(state.registerPanel(key));
  },
  { immediate: true },
);

const element = shallowRef<HTMLElement | null>(null);

const { isEntering, isExiting, isPresent } = useEnterExit({
  elementRef: element,
  isOpen: () => isSelected.value,
});

// A panel kept mounted while another tab is selected is inert rather than gone, so nothing
// inside it is reachable by tab or read out of order.
const isRendered = computed(() => isPresent.value || Boolean(props.shouldForceMount));

const { isFocusVisible, isFocused, onBlur, onFocus } = useInteractionStates();
</script>

<template>
  <div
    v-if="isRendered"
    :id="state.tabPanelId(panelKey)"
    ref="element"
    :aria-labelledby="state.tabId(panelKey)"
    :class="slots.tabPanel({ class: props.class })"
    :data-entering="dataAttr(isEntering)"
    :data-exiting="dataAttr(isExiting)"
    :data-focus-visible="dataAttr(isFocusVisible)"
    :data-focused="dataAttr(isFocused)"
    :data-inert="isSelected ? undefined : 'true'"
    data-slot="tabs-panel"
    :inert="!isSelected"
    role="tabpanel"
    :tabindex="isSelected ? 0 : undefined"
    @blur="onBlur"
    @focus="onFocus"
  >
    <slot
      :is-entering="isEntering"
      :is-exiting="isExiting"
      :is-focus-visible="isFocusVisible"
      :is-focused="isFocused"
    />
  </div>
</template>
