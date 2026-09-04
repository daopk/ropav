<script setup lang="ts" vapor>
import type { AccordionProps } from "@/components/accordion";

import {
  Accordion,
  AccordionBody,
  AccordionHeading,
  AccordionIndicator,
  AccordionItem,
  AccordionPanel,
  AccordionTrigger,
} from "@/components/accordion";

defineProps<AccordionProps & { customIndicator?: boolean; disabledItem?: string }>();

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
    <AccordionItem
      v-for="item in items"
      :id="item"
      :key="item"
      :is-disabled="item === $props.disabledItem"
    >
      <AccordionHeading>
        <AccordionTrigger>
          Trigger {{ item }}
          <AccordionIndicator>
            <svg v-if="$props.customIndicator" data-testid="custom-indicator" />
          </AccordionIndicator>
        </AccordionTrigger>
      </AccordionHeading>
      <AccordionPanel>
        <AccordionBody>Panel {{ item }}</AccordionBody>
      </AccordionPanel>
    </AccordionItem>
  </Accordion>
</template>
