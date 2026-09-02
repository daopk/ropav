<script setup lang="ts" vapor>
import type { SplitterPanelProps, SplitterPanelSlotProps } from "./splitter.types";

import { computed, shallowRef, watch } from "vue";

import { useId } from "../../composables/use-id";
import { dataAttr } from "../../utils/assertion";
import { composeSlotClassName } from "../../utils/compose";

import { useSplitterContext } from "./splitter.context";

const props = withDefaults(defineProps<SplitterPanelProps>(), { isCollapsible: undefined });

defineSlots<{ default?: (props: SplitterPanelSlotProps) => unknown }>();

const { orientation, slots, state } = useSplitterContext();

const generatedId = useId();
const panelKey = computed(() => props.id ?? generatedId.value);

const element = shallowRef<HTMLElement | null>(null);

// Registered post-flush so the element is attached before the registry asks the DOM where it sits.
// Metadata is handed over as getters, so a later prop change needs no re-registration.
watch(
  [element, panelKey],
  ([current], _previous, onCleanup) => {
    if (!current) return;

    onCleanup(
      state.registerPanel(panelKey.value, {
        collapsedSize: () => props.collapsedSize,
        defaultSize: () => props.defaultSize,
        element: () => element.value,
        id: () => generatedId.value,
        isCollapsible: () => Boolean(props.isCollapsible),
        maxSize: () => props.maxSize,
        minSize: () => props.minSize,
        size: () => props.size,
      }),
    );
  },
  { flush: "post", immediate: true },
);

const size = computed(() => state.getPanelSize(panelKey.value));
const isCollapsed = computed(() => state.isCollapsed(panelKey.value));

/*
 * The whole `flex` shorthand, never a lone basis: the stylesheet carries `flex-1` as the
 * unmanaged fallback, and setting only the basis would leave that `flex-grow: 1` in place and the
 * panel would grow straight back past the size it was given.
 *
 * No inline flex at all until the container has been measured, so a splitter that has not been
 * laid out yet falls back to the stylesheet rather than collapsing every panel to nothing.
 */
const style = computed(() =>
  state.layout.value.length > 0 ? { flex: `0 0 ${size.value}px` } : undefined,
);
</script>

<template>
  <div
    :id="generatedId"
    ref="element"
    :class="composeSlotClassName(slots.panel, props.class)"
    :data-collapsed="dataAttr(isCollapsed)"
    :data-orientation="orientation"
    data-slot="splitter-panel"
    :inert="isCollapsed || undefined"
    :style="style"
  >
    <slot
      :is-collapsed="isCollapsed"
      :is-collapsible="Boolean(props.isCollapsible)"
      :orientation="orientation"
      :size="size"
    />
  </div>
</template>
