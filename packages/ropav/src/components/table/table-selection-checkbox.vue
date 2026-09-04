<script setup lang="ts" vapor>
import type { TableSelectionCheckboxProps } from "./table.types";

import { computed } from "vue";

import { useId } from "../../composables/use-id";
import { CheckboxContent, CheckboxControl, CheckboxIndicator, Checkbox } from "../checkbox";

import { useTableGridContext, useTableRowContextOptional } from "./table.context";

const props = defineProps<TableSelectionCheckboxProps>();

const { collection, selection } = useTableGridContext();

// Which of the two checkboxes this is comes from where it sits: inside a row it selects that
// row, in the header it selects everything. React Aria makes the same distinction, through the
// slot a `Checkbox` is given rather than through the tree.
const row = useTableRowContextOptional();

const checkboxId = useId();

const isSelectAll = computed(() => selection.isSelectAll.value);

const isSelected = computed(() =>
  row ? selection.isSelected(row.rowKey.value) : isSelectAll.value,
);

// Ported from react-aria's `useTableSelectAllCheckbox`: the mixed state stands for "some but
// not all", and a table with nothing to select has nothing for the header to toggle.
const isIndeterminate = computed(() => !row && !selection.isEmpty.value && !isSelectAll.value);

const isDisabled = computed(() =>
  row
    ? !selection.canSelectItem(row.rowKey.value)
    : selection.selectionMode.value !== "multiple" || collection.rows.size.value === 0,
);

const ariaLabel = computed(() => {
  if (props.ariaLabel) return props.ariaLabel;

  return !row && selection.selectionMode.value === "multiple" ? "Select All" : "Select";
});

// A row's checkbox is named by the row as well as by itself, so hearing it read out says which
// row is being selected. The self-reference comes first, exactly as react-aria orders it.
const ariaLabelledBy = computed(() =>
  row && row.ariaLabelledBy.value ? `${checkboxId.value} ${row.ariaLabelledBy.value}` : undefined,
);

const onChange = () => {
  if (row) {
    // Always a toggle, whatever the selection behaviour: a checkbox that replaced the
    // selection would contradict the box the user just ticked.
    selection.toggleSelection(row.rowKey.value);

    return;
  }

  if (isSelectAll.value) selection.clearSelection();
  else selection.selectAll();
};
</script>

<template>
  <Checkbox
    :id="checkboxId"
    :aria-label="ariaLabel"
    :aria-labelledby="ariaLabelledBy"
    :class="props.class"
    :is-disabled="isDisabled"
    :is-indeterminate="isIndeterminate"
    :is-selected="isSelected"
    :variant="props.variant"
    @change="onChange"
    @click.stop
  >
    <CheckboxContent>
      <CheckboxControl>
        <CheckboxIndicator />
      </CheckboxControl>
    </CheckboxContent>
  </Checkbox>
</template>
