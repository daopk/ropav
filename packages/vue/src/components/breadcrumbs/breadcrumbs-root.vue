<script setup lang="ts" vapor>
import type {BreadcrumbsRootProps} from "./breadcrumbs.types";

import {breadcrumbsVariants} from "@heroui/styles";
import {computed} from "vue";

import {useCollection} from "../../composables/use-collection";
import {useLocalizedStringFormatter} from "../../composables/use-localized-string-formatter";
import {breadcrumbsStrings} from "../../i18n/breadcrumbs";

import {provideBreadcrumbsContext} from "./breadcrumbs.context";

const props = withDefaults(defineProps<BreadcrumbsRootProps>(), {isDisabled: undefined});

const emit = defineEmits<{action: [key: string | number]}>();

defineSlots<{default?: () => unknown}>();

const collection = useCollection();
const formatter = useLocalizedStringFormatter(breadcrumbsStrings);
const slots = computed(() => breadcrumbsVariants());

const label = computed(() => props.ariaLabel || formatter.value.format("breadcrumbs"));

provideBreadcrumbsContext({
  collection,
  isDisabled: computed(() => Boolean(props.isDisabled)),
  onAction: (key) => emit("action", key),
  separator: computed(() => props.separator),
  slots,
});
</script>

<template>
  <ol
    :aria-label="label"
    :aria-labelledby="props.ariaLabelledby"
    :class="slots.base({class: props.class})"
    data-slot="breadcrumbs"
  >
    <slot />
  </ol>
</template>
