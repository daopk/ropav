<script setup lang="ts" vapor>
import type { AccordionRootProps } from "@/components/accordion";

import { Accordion } from "@/components/accordion";

defineProps<AccordionRootProps & { customIndicator?: boolean; disabledItem?: string }>();

defineEmits<{ expandedChange: [keys: Set<string | number>] }>();

const items = ["one", "two", "three"];
</script>

<template>
  <Accordion
    :allows-multiple-expanded="$props.allowsMultipleExpanded"
    :class="$props.class"
    :default-expanded-keys="$props.defaultExpandedKeys"
    :expanded-keys="$props.expandedKeys"
    :hide-separator="$props.hideSeparator"
    :is-disabled="$props.isDisabled"
    :variant="$props.variant"
    @expanded-change="$emit('expandedChange', $event)"
  >
    <Accordion.Item
      v-for="item in items"
      :id="item"
      :key="item"
      :is-disabled="item === $props.disabledItem"
    >
      <Accordion.Heading>
        <Accordion.Trigger>
          Trigger {{ item }}
          <Accordion.Indicator>
            <svg v-if="$props.customIndicator" data-testid="custom-indicator" />
          </Accordion.Indicator>
        </Accordion.Trigger>
      </Accordion.Heading>
      <Accordion.Panel>
        <Accordion.Body>Panel {{ item }}</Accordion.Body>
      </Accordion.Panel>
    </Accordion.Item>
  </Accordion>
</template>
