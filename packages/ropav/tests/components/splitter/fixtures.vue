<script setup lang="ts" vapor>
import type { SplitterFixturePanel } from "./fixtures.types";
import type { SplitterRootProps, SplitterSize } from "@/components/splitter";

import { Splitter, SplitterHandle, SplitterPanel } from "@/components/splitter";

const props = defineProps<
  SplitterRootProps & {
    /**
     * Turns the double-click gesture off. Phrased as an opt-out because Vue casts an absent
     * boolean prop to `false`: forwarding a `resetOnDoubleClick` nobody set would disable the
     * gesture in every case, whereas an absent opt-out forwards `undefined` and lets the handle's
     * own default stand.
     */
    noReset?: boolean;
    panels?: SplitterFixturePanel[];
    /** Turns the visible grip on for every handle. */
    showGrip?: boolean;
    /** Renders an unbreakable word, to prove a panel can still be dragged narrower than it. */
    withWideContent?: boolean;
  }
>();

defineEmits<{
  "update:sizes": [sizes: SplitterSize[]];
  collapse: [key: string | number];
  expand: [key: string | number];
  resize: [sizes: SplitterSize[]];
}>();

const defaultPanels: SplitterFixturePanel[] = [{ id: "start" }, { id: "end" }];
</script>

<template>
  <Splitter
    :aria-label="props.ariaLabel ?? 'Editor layout'"
    :auto-save-id="props.autoSaveId"
    :class="props.class"
    :default-sizes="props.defaultSizes"
    :is-disabled="props.isDisabled"
    :keyboard-step="props.keyboardStep"
    :orientation="props.orientation"
    :sizes="props.sizes"
    @collapse="$emit('collapse', $event)"
    @expand="$emit('expand', $event)"
    @resize="$emit('resize', $event)"
    @update:sizes="$emit('update:sizes', $event)"
  >
    <template v-for="(panel, index) of props.panels ?? defaultPanels" :key="panel.id">
      <SplitterHandle
        v-if="index > 0"
        :id="`handle-${index - 1}`"
        :reset-on-double-click="props.noReset ? false : undefined"
        :show-grip="props.showGrip"
      />
      <SplitterPanel
        :id="panel.id"
        :collapsed-size="panel.collapsedSize"
        :default-size="panel.defaultSize"
        :is-collapsible="panel.isCollapsible"
        :max-size="panel.maxSize"
        :min-size="panel.minSize"
      >
        <span v-if="props.withWideContent">Supercalifragilisticexpialidocious</span>
        <span v-else>{{ panel.id }}</span>
      </SplitterPanel>
    </template>
  </Splitter>
</template>
