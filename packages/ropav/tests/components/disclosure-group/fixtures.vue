<script setup lang="ts" vapor>
import type { DisclosureGroupRootProps } from "@/components/disclosure-group";

import { Button } from "@/components/button";
import { Disclosure } from "@/components/disclosure";
import { DisclosureGroup } from "@/components/disclosure-group";

/**
 * `bareTriggers` swaps every `Disclosure.Trigger` for an ordinary `Button`, which is the form
 * the disclosure hands its press down to.
 */
const props = withDefaults(
  defineProps<
    DisclosureGroupRootProps & { bareTriggers?: boolean; disabledItem?: string; items?: string[] }
  >(),
  {
    allowsMultipleExpanded: undefined,
    disabledItem: undefined,
    isDisabled: undefined,
    items: () => ["one", "two", "three"],
  },
);

defineEmits<{ expandedChange: [keys: Set<string | number>] }>();
</script>

<template>
  <DisclosureGroup
    :allows-multiple-expanded="props.allowsMultipleExpanded"
    :class="props.class"
    :default-expanded-keys="props.defaultExpandedKeys"
    :expanded-keys="props.expandedKeys"
    :is-disabled="props.isDisabled"
    @expanded-change="$emit('expandedChange', $event)"
  >
    <Disclosure
      v-for="item in props.items"
      :id="item"
      :key="item"
      :is-disabled="item === props.disabledItem"
    >
      <Disclosure.Heading>
        <Button v-if="props.bareTriggers" :data-testid="`bare-${item}`">
          Trigger {{ item }}
          <Disclosure.Indicator />
        </Button>
        <Disclosure.Trigger v-else>
          Trigger {{ item }}
          <Disclosure.Indicator />
        </Disclosure.Trigger>
      </Disclosure.Heading>
      <Disclosure.Content>
        <Disclosure.Body>Panel {{ item }}</Disclosure.Body>
      </Disclosure.Content>
    </Disclosure>
  </DisclosureGroup>
</template>
