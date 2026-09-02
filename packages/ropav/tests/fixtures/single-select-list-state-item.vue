<script setup lang="ts" vapor>
import type { SingleSelectListStateItemProps } from "./single-select-list-state.types";

import { shallowRef, watch } from "vue";

const props = withDefaults(defineProps<SingleSelectListStateItemProps>(), {
  isDisabled: undefined,
});

const element = shallowRef<HTMLElement | null>(null);

/*
 * Registered from a watcher rather than from the ref itself, which is what a real item does.
 * `register` increments a counter, and an increment reads before it writes — so registering
 * inside a tracked scope makes that scope depend on the counter it just bumped.
 */
watch(
  element,
  (current, _previous, onCleanup) => {
    if (!current) return;

    onCleanup(
      props.collection.register(props.itemKey, {
        element: () => element.value,
        isDisabled: () => Boolean(props.isDisabled),
        textValue: () => String(props.itemKey),
      }),
    );
  },
  { flush: "post", immediate: true },
);
</script>

<template>
  <div ref="element" :data-testid="`item-${props.itemKey}`">{{ props.itemKey }}</div>
</template>
