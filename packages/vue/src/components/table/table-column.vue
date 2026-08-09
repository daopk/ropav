<script setup lang="ts" vapor>
import type {TableColumnProps, TableColumnSlotProps, TableSortDirection} from "./table.types";

import {computed, shallowRef, watch} from "vue";

import {useDescription} from "../../composables/use-description";
import {useId} from "../../composables/use-id";
import {useInteractionStates} from "../../composables/use-interaction-states";
import {tableColumnHeaderId} from "../../composables/use-table-collection";
import {dataAttr} from "../../utils/assertion";
import {composeSlotClassName} from "../../utils/compose";
import {getCollectionTextValue} from "../../utils/text-value";

import {useTableContext, useTableGridContext} from "./table.context";

const props = defineProps<TableColumnProps>();

defineSlots<{default?: (props: TableColumnSlotProps) => unknown}>();

const {slots} = useTableContext();
const {collection, collectionId, keyboard, sort, sortDescriptor, tableId} = useTableGridContext();

// Falls back to a generated key so a column without an `id` still has a stable identity — the
// same thing React Aria does when a `<Column>` carries no key.
const generatedKey = useId();
const columnKey = computed(() => props.id ?? generatedKey.value);

const element = shallowRef<HTMLElement | null>(null);

// Registered post-flush so the element is attached before the registry asks the DOM where it
// sits. Metadata is handed over as getters, so a later prop change needs no re-registration.
watch(
  element,
  (current, _previous, onCleanup) => {
    if (!current) return;

    onCleanup(
      collection.columns.register(columnKey.value, {
        element: () => element.value,
        isRowHeader: () => Boolean(props.isRowHeader),
        textValue: () => getCollectionTextValue(element.value),
      }),
    );
  },
  {flush: "post", immediate: true},
);

const index = computed(() => collection.columns.indexOf(columnKey.value));

// `aria-colindex` is one-based, and is left off entirely until the registration settles rather
// than rendering a zero that would claim a position no column holds.
const ariaColIndex = computed(() => (index.value < 0 ? undefined : index.value + 1));

const allowsSorting = computed(() => Boolean(props.allowsSorting));

const sortDirection = computed<TableSortDirection | undefined>(() =>
  sortDescriptor.value?.column === columnKey.value ? sortDescriptor.value.direction : undefined,
);

// A sortable column always reports a sort state, so assistive technology can tell it apart from
// a column that simply is not sorted right now.
const ariaSort = computed(() =>
  allowsSorting.value ? (sortDirection.value ?? "none") : undefined,
);

// Says the header can be pressed at all — `aria-sort` reports the order but not that it is
// yours to change. The wording is react-aria's own en-US string.
const {describedBy} = useDescription(() => (allowsSorting.value ? "sortable column" : undefined));

const states = useInteractionStates();

// Hover and press are reported only where they mean something: a column that cannot be sorted
// does nothing when pressed, and the stylesheet's hover branch is gated on sortability too.
const isHovered = computed(() => allowsSorting.value && states.isHovered.value);
const isPressed = computed(() => allowsSorting.value && states.isPressed.value);

const sortByThisColumn = (direction?: TableSortDirection) => {
  if (!allowsSorting.value) return;

  sort(columnKey.value, direction);
};

const onClick = () => sortByThisColumn();

// Focus can arrive without the grid having moved it — a click, a screen reader stepping through,
// `.focus()` from anywhere — and a focused target that disagrees with real focus would leave the
// roving tab stop on one part while the ring is on another.
const onFocus = (event: FocusEvent) => {
  states.onFocus();

  if (event.target !== element.value) return;

  keyboard.claimFocus({columnKey: columnKey.value, rowKey: null});
};

/**
 * A `th` is not a button, so Enter and Space never reach it as a click. React Aria's `usePress`
 * covers this for every pressable element; here the two keys are handled where they land.
 */
const onKeydown = (event: KeyboardEvent) => {
  if (!allowsSorting.value) return;
  if (event.key !== "Enter" && event.key !== " ") return;

  // Space would scroll the table, and either key would reach the grid's own handler.
  event.preventDefault();
  event.stopPropagation();
  sortByThisColumn();
};
</script>

<template>
  <th
    :id="tableColumnHeaderId(tableId, columnKey)"
    ref="element"
    :aria-colindex="ariaColIndex"
    :aria-describedby="describedBy"
    :aria-sort="ariaSort"
    :class="composeSlotClassName(slots.column, props.class)"
    :data-allows-sorting="dataAttr(allowsSorting)"
    :data-collection="collectionId"
    :data-focus-visible="dataAttr(states.isFocusVisible.value)"
    :data-focused="dataAttr(states.isFocused.value)"
    :data-hovered="dataAttr(isHovered)"
    :data-key="columnKey"
    :data-pressed="dataAttr(isPressed)"
    data-slot="table-column"
    :data-sort-direction="sortDirection"
    role="columnheader"
    :tabindex="keyboard.columnTabIndex(columnKey)"
    @blur="states.onBlur"
    @click="onClick"
    @focus="onFocus"
    @keydown="onKeydown"
    @pointerdown="states.onPointerdown"
    @pointerenter="states.onPointerenter"
    @pointerleave="states.onPointerleave"
  >
    <slot
      :allows-sorting="allowsSorting"
      :is-focus-visible="states.isFocusVisible.value"
      :is-hovered="isHovered"
      :is-pressed="isPressed"
      :sort="sortByThisColumn"
      :sort-direction="sortDirection"
    />
  </th>
</template>
