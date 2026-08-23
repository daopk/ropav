<script setup lang="ts" vapor>
import type { DisclosureKey } from "../../composables/use-disclosure-group";
import type { AccordionItemProps } from "./accordion.types";

import { computed } from "vue";

import { useId } from "../../composables/use-id";
import { dataAttr } from "../../utils/assertion";
import { composeSlotClassName } from "../../utils/compose";

import { provideAccordionItemContext, useAccordionContext } from "./accordion.context";

const props = defineProps<AccordionItemProps>();

defineSlots<{ default?: () => unknown }>();

const { group, hideSeparator, slots } = useAccordionContext();

const itemId = useId(() => props.id);
const itemKey = computed<DisclosureKey>(() => itemId.value);
const triggerId = computed(() => `${itemId.value}-trigger`);
const panelId = computed(() => `${itemId.value}-panel`);

const isExpanded = computed(() => group.isExpanded(itemKey.value));
const isDisabled = computed(() => (props.isDisabled ?? false) || group.isDisabled.value);

const toggle = () => {
  if (isDisabled.value) return;

  group.toggle(itemKey.value);
};

provideAccordionItemContext({
  isDisabled,
  isExpanded,
  onTriggerKeydown: group.onTriggerKeydown,
  panelId,
  registerTrigger: (element) => group.registerTrigger(itemKey.value, element),
  toggle,
  triggerId,
});
</script>

<template>
  <div
    :id="props.id"
    :class="composeSlotClassName(slots.item, props.class)"
    :data-disabled="dataAttr(isDisabled)"
    :data-expanded="dataAttr(isExpanded)"
    :data-hide-separator="dataAttr(hideSeparator)"
    data-slot="accordion-item"
  >
    <slot />
  </div>
</template>
