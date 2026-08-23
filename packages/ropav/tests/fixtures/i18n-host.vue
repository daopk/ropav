<script setup lang="ts" vapor>
import type { I18nHostProps } from "./i18n.types";

import { useCollator } from "@/composables/use-collator";
import { useDateFormatter } from "@/composables/use-date-formatter";
import { useDisplayNames } from "@/composables/use-display-names";
import { useFilter } from "@/composables/use-filter";
import { useLocalizedStringFormatter } from "@/composables/use-localized-string-formatter";
import { useNumberFormatter } from "@/composables/use-number-formatter";
import { calendarStrings } from "@/i18n/calendar";

const props = defineProps<I18nHostProps>();

props.onReady?.({
  collator: useCollator(),
  dateFormatter: useDateFormatter(() => props.dateOptions),
  displayNames: useDisplayNames(),
  filter: useFilter(props.filterOptions),
  numberFormatter: useNumberFormatter(),
  strings: useLocalizedStringFormatter(calendarStrings),
});
</script>

<template>
  <span data-slot="i18n-host" />
</template>
