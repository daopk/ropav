<script setup lang="ts" vapor>
import type { DisclosureRootProps } from "@/components/disclosure";

import { Button } from "@/components/button";
import { Disclosure } from "@/components/disclosure";

/**
 * `bareTrigger` swaps `Disclosure.Trigger` for an ordinary `Button`, which is the form the
 * disclosure hands its press down to.
 */
const props = withDefaults(
  defineProps<DisclosureRootProps & { bareTrigger?: boolean; customIndicator?: boolean }>(),
  { defaultExpanded: undefined, isDisabled: undefined, isExpanded: undefined },
);

defineEmits<{ expandedChange: [isExpanded: boolean] }>();
</script>

<template>
  <Disclosure
    :id="props.id"
    :class="props.class"
    :default-expanded="props.defaultExpanded"
    :is-disabled="props.isDisabled"
    :is-expanded="props.isExpanded"
    @expanded-change="$emit('expandedChange', $event)"
  >
    <Disclosure.Heading>
      <Button v-if="props.bareTrigger" data-testid="bare-trigger">
        Toggle content
        <Disclosure.Indicator />
      </Button>
      <Disclosure.Trigger v-else>
        Toggle content
        <Disclosure.Indicator v-if="props.customIndicator">
          <svg data-testid="custom-indicator" />
        </Disclosure.Indicator>
        <Disclosure.Indicator v-else />
      </Disclosure.Trigger>
    </Disclosure.Heading>
    <Disclosure.Content>
      <Disclosure.Body>
        Hidden content revealed on expand.
        <Button data-testid="body-button" variant="secondary">Body action</Button>
      </Disclosure.Body>
    </Disclosure.Content>
  </Disclosure>
</template>
