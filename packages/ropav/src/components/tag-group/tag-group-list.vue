<script setup lang="ts" vapor>
import type { TagGroupListProps } from "./tag-group.types";

import { computed, onMounted, shallowRef } from "vue";

import { dataAttr } from "../../utils/assertion";

import { useTagGroupContext } from "./tag-group.context";

const props = defineProps<TagGroupListProps>();

defineSlots<{ default?: () => unknown; empty?: () => unknown }>();

const {
  collection,
  collectionId,
  fieldIds,
  keyboard,
  listElement,
  listId,
  selection,
  slots,
  typeahead,
} = useTagGroupContext();

// Tags register post-flush, so the collection reads as empty during the first render even when it
// is not. Waiting for the mount keeps the empty state from mounting and unmounting in one tick —
// invisible, but it would still run whatever that slot does on the way past.
const hasMounted = shallowRef(false);

onMounted(() => {
  hasMounted.value = true;
});

const isEmpty = computed(() => collection.size.value === 0);
const showsEmptyState = computed(() => hasMounted.value && isEmpty.value);

// A grid needs rows to be a grid. With none, it is only a labelled group — which is also what
// keeps assistive technology from announcing an empty table.
const role = computed(() => (isEmpty.value ? "group" : "grid"));

// Announced only while focus is inside: a tag list that keeps talking as the page changes around
// it is noise, but one the user is working in should report what they just removed.
const ariaLive = computed(() => (selection.isFocused.value ? "polite" : "off"));

// The element belongs to the group — it owns the keyboard and the collection — but it is this
// part that renders it, so the reference is handed back on mount.
const setListElement = (element: unknown) => {
  listElement.value = (element as HTMLElement | null) ?? null;
};

const onKeydown = (event: KeyboardEvent) => {
  typeahead.onKeydown(event);
  if (!event.defaultPrevented) keyboard.onKeydown(event);
};
</script>

<template>
  <div
    :id="listId"
    :ref="setListElement"
    aria-atomic="false"
    :aria-describedby="fieldIds.describedBy.value"
    :aria-label="props.ariaLabel"
    :aria-labelledby="fieldIds.labelId.value"
    :aria-live="ariaLive"
    aria-relevant="additions"
    :class="slots.list({ class: props.class })"
    :data-collection="collectionId"
    :data-empty="dataAttr(isEmpty)"
    :data-focus-visible="dataAttr(selection.isFocused.value)"
    data-slot="tag-group-list"
    :role="role"
    :tabindex="keyboard.collectionTabIndex.value"
    @focusin="keyboard.onFocusin"
    @focusout="keyboard.onFocusout"
    @keydown="onKeydown"
    @keydown.capture="typeahead.onKeydownCapture"
  >
    <slot />
    <slot v-if="showsEmptyState" name="empty" />
  </div>
</template>
