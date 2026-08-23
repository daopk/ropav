<script setup lang="ts" vapor>
import type { BreadcrumbsRootProps } from "./breadcrumbs.types";

import { breadcrumbsVariants } from "@ropav/styles";
import { computed, shallowRef, watch } from "vue";

import { useCollection } from "../../composables/use-collection";
import { useLocalizedStringFormatter } from "../../composables/use-localized-string-formatter";
import { breadcrumbsStrings } from "../../i18n/breadcrumbs";

import { provideBreadcrumbsContext } from "./breadcrumbs.context";

const props = withDefaults(defineProps<BreadcrumbsRootProps>(), { isDisabled: undefined });

const emit = defineEmits<{ action: [key: string | number] }>();

defineSlots<{ default?: () => unknown }>();

const collection = useCollection();
const formatter = useLocalizedStringFormatter(breadcrumbsStrings);
const slots = computed(() => breadcrumbsVariants());
const element = shallowRef<HTMLOListElement | null>(null);
const orderVersion = shallowRef(0);

// Collection size invalidates append/remove, but a keyed reorder moves the same `<li>` nodes and
// does not register again. Observe only direct children so internal Link updates do not create
// noise, and let every item recompute current state from the new document order.
watch(
  element,
  (current, _previous, onCleanup) => {
    if (!current || typeof MutationObserver === "undefined") return;

    const observer = new MutationObserver(() => {
      orderVersion.value += 1;
    });

    observer.observe(current, { childList: true });
    onCleanup(() => observer.disconnect());
  },
  { flush: "post", immediate: true },
);

const label = computed(() => props.ariaLabel || formatter.value.format("breadcrumbs"));

provideBreadcrumbsContext({
  collection,
  isDisabled: computed(() => Boolean(props.isDisabled)),
  onAction: (key) => emit("action", key),
  orderVersion,
  separator: computed(() => props.separator),
  slots,
});
</script>

<template>
  <ol
    ref="element"
    :aria-label="label"
    :aria-labelledby="props.ariaLabelledby"
    :class="slots.base({ class: props.class })"
    data-slot="breadcrumbs"
  >
    <slot />
  </ol>
</template>
