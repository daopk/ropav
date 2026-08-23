<script setup lang="ts" vapor generic="T">
import type {VirtualizerNode} from "../../utils/virtualizer-layout";
import type {TableBodyProps, TableBodySlotProps} from "./table.types";

import {computed, onMounted, shallowRef, watch} from "vue";

import {dataAttr} from "../../utils/assertion";
import {composeSlotClassName} from "../../utils/compose";

import TableDropIndicator from "./table-drop-indicator.vue";
import TableVirtualizerItem from "./table-virtualizer-item.vue";
import {useTableContext, useTableGridContext, useTableVirtualizerContext} from "./table.context";

const props = defineProps<TableBodyProps<T>>();

defineSlots<{
  default?: (props: TableBodySlotProps<T>) => unknown;
  empty?: () => unknown;
  loader?: () => unknown;
}>();

const {slots} = useTableContext();
const {collection, dropState} = useTableGridContext();

const virtualizer = useTableVirtualizerContext();

/**
 * A row node's datum, back as the item type it came in as.
 *
 * `VirtualizerNode.content` is `unknown` on purpose — the virtualizer carries data it never looks
 * at, and the same layout serves a listbox. This body is the one place that knows better: the
 * collection was built out of its own `items`, so naming `T` here restates what went in.
 */
const itemOf = (node?: VirtualizerNode) => node?.content as T | undefined;

/**
 * The rows' data goes **up** to the grid, which is what owns the collection, the scroll box and
 * the keyboard. `items` is declared on the body, so this is where it is handed over.
 */
if (virtualizer) {
  watch(
    () => [props.items, props.itemKey, props.itemTextValue] as const,
    ([items, getKey, getTextValue]) => {
      virtualizer.setItems(
        items
          ? {
              getKey: getKey as ((item: unknown, index: number) => never) | undefined,
              getTextValue: getTextValue as ((item: unknown) => string | undefined) | undefined,
              items,
            }
          : null,
      );
    },
    {immediate: true},
  );
}

// Rows register post-flush, so the collection reads as empty during the first render even when
// it is not. Waiting for the mount keeps the empty state from mounting and unmounting in one
// tick — invisible, but it would still run whatever that slot does on the way past.
const hasMounted = shallowRef(false);

onMounted(() => {
  hasMounted.value = true;
});

const isEmpty = computed(() => collection.rows.size.value === 0);
const showsEmptyState = computed(() => hasMounted.value && isEmpty.value);

// The placeholder row spans the whole grid, so it needs the live column count rather than a
// guess. One is the floor: `colspan="0"` means "to the end of the section" in some engines.
const columnCount = computed(() => Math.max(1, collection.columns.size.value));

const layoutInfo = computed(() =>
  virtualizer ? virtualizer.getLayoutInfo(virtualizer.collection.value.bodyKey) : null,
);

/**
 * A virtualized placeholder is not a table cell that can span columns, so it says so with
 * `aria-colspan` and takes itself out of the layout — the row it stands in for has no geometry.
 */
const emptyStateStyle = computed(() => (virtualizer ? {display: "contents"} : undefined));

/**
 * A windowed body renders its own drop indicators; a plain one leaves them to the caller.
 *
 * Not a second way of doing the same thing — it is the only way. An indicator is positioned
 * against the row wrappers it sits between, which makes it their **sibling**, and this is the
 * level that produces them. Markup written in the row slot lands *inside* one wrapper, where an
 * absolute offset would be measured from the wrong origin and clipped by its overflow.
 */
const rendersDropIndicators = computed(() => virtualizer != null && dropState != null);

/** The gap after the last row, which no row's own "before" indicator covers. */
const lastRowKey = computed(() => collection.rows.getLastKey());
</script>

<template>
  <TableVirtualizerItem :layout-info="layoutInfo">
    <component
      :is="virtualizer ? 'div' : 'tbody'"
      :class="composeSlotClassName(slots.body, props.class)"
      :data-empty="dataAttr(isEmpty)"
      data-slot="table-body"
      role="rowgroup"
    >
      <template v-if="virtualizer">
        <template v-for="view in virtualizer.rowViews.value" :key="view.key">
          <TableDropIndicator
            v-if="rendersDropIndicators"
            :target="{dropPosition: 'before', key: view.key, type: 'item'}"
          />
          <TableVirtualizerItem :layout-info="view.layoutInfo" :parent-layout-info="layoutInfo">
            <slot :index="view.node?.index" :item="itemOf(view.node)" />
          </TableVirtualizerItem>
        </template>
        <TableDropIndicator
          v-if="rendersDropIndicators && lastRowKey != null"
          :target="{dropPosition: 'after', key: lastRowKey, type: 'item'}"
        />
      </template>
      <slot v-else />
      <slot name="loader" />
      <component
        :is="virtualizer ? 'div' : 'tr'"
        v-if="showsEmptyState"
        role="row"
        :style="emptyStateStyle"
      >
        <component
          :is="virtualizer ? 'div' : 'td'"
          :aria-colspan="virtualizer ? columnCount : undefined"
          :colspan="virtualizer ? undefined : columnCount"
          role="rowheader"
          :style="emptyStateStyle"
        >
          <slot name="empty" />
        </component>
      </component>
    </component>
  </TableVirtualizerItem>
</template>
