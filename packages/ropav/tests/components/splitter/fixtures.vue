<script setup lang="ts" vapor>
import type { SplitterFixturePanel } from "./fixtures.types";
import type { SplitterRootProps, SplitterSize } from "@/components/splitter";

import { Splitter, SplitterHandle, SplitterPanel } from "@/components/splitter";

const props = defineProps<
  SplitterRootProps & {
    panels?: SplitterFixturePanel[];
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
      <SplitterHandle v-if="index > 0" :id="`handle-${index - 1}`" />
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
