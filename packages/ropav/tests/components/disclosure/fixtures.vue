<script setup lang="ts" vapor>
import type { DisclosureProps } from "@/components/disclosure";

import { Button } from "@/components/button";
import {
  Disclosure,
  DisclosureBody,
  DisclosureContent,
  DisclosureHeading,
  DisclosureIndicator,
  DisclosureTrigger,
} from "@/components/disclosure";

/**
 * `bareTrigger` swaps `DisclosureTrigger` for an ordinary `Button`, which is the form the
 * disclosure hands its press down to.
 */
const props = withDefaults(
  defineProps<DisclosureProps & { bareTrigger?: boolean; customIndicator?: boolean }>(),
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
    <DisclosureHeading>
      <Button v-if="props.bareTrigger" data-testid="bare-trigger">
        Toggle content
        <DisclosureIndicator />
      </Button>
      <DisclosureTrigger v-else>
        Toggle content
        <DisclosureIndicator v-if="props.customIndicator">
          <svg data-testid="custom-indicator" />
        </DisclosureIndicator>
        <DisclosureIndicator v-else />
      </DisclosureTrigger>
    </DisclosureHeading>
    <DisclosureContent>
      <DisclosureBody>
        Hidden content revealed on expand.
        <Button data-testid="body-button" variant="secondary">Body action</Button>
      </DisclosureBody>
    </DisclosureContent>
  </Disclosure>
</template>
