<script setup lang="ts" vapor>
import type { BreadcrumbsItemProps, BreadcrumbsItemSlotProps } from "./breadcrumbs.types";

import { computed, shallowRef, watch } from "vue";

import { useId } from "../../composables/use-id";
import { dataAttr } from "../../utils/assertion";
import { composeSlotClassName } from "../../utils/compose";
import { IconChevronRight } from "../icons";
import { Link } from "../link";

import { useBreadcrumbsContext } from "./breadcrumbs.context";

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<BreadcrumbsItemProps>(), {
  download: undefined,
  isDisabled: undefined,
});

const emit = defineEmits<{ click: [event: MouseEvent] }>();

defineSlots<{ default?: (props: BreadcrumbsItemSlotProps) => unknown }>();

const context = useBreadcrumbsContext();
const generatedKey = useId();
const itemKey = computed(() => props.id ?? generatedKey.value);
const element = shallowRef<HTMLElement | null>(null);

watch(
  element,
  (current, _previous, onCleanup) => {
    if (!current) return;

    onCleanup(
      context.collection.register(itemKey.value, {
        element: () => element.value,
        isDisabled: () => Boolean(props.isDisabled || context.isDisabled.value),
        textValue: () => element.value?.textContent ?? "",
      }),
    );
  },
  { flush: "post", immediate: true },
);

const isCurrent = computed(() => {
  // Size handles append/remove; orderVersion handles keyed moves that keep the same registrations.
  void context.collection.size.value;
  void context.orderVersion.value;

  return context.collection.getLastKey() === itemKey.value;
});

const isDisabled = computed(() =>
  Boolean(props.isDisabled || context.isDisabled.value || isCurrent.value),
);

const isTextSeparator = computed(
  () => typeof context.separator.value === "string" || typeof context.separator.value === "number",
);

const onClick = (event: MouseEvent) => {
  if (isDisabled.value) {
    event.preventDefault();

    return;
  }

  emit("click", event);
};

// Activation rides the press, not the click. An item with no href renders as a span, where Enter
// is prevented and no click follows, so the click alone would drop every keyboard activation on
// those items. The press composable already withholds the press while the item is disabled.
const onPress = () => context.onAction(itemKey.value);
</script>

<template>
  <li
    ref="element"
    :class="composeSlotClassName(context.slots.value.item, $props.class)"
    :data-current="dataAttr(isCurrent)"
    :data-disabled="dataAttr(isDisabled)"
    data-slot="breadcrumbs-item"
    v-bind="$attrs"
  >
    <Link
      :aria-current="isCurrent ? 'page' : undefined"
      :aria-describedby="$props.ariaDescribedby"
      :aria-label="$props.ariaLabel"
      :aria-labelledby="$props.ariaLabelledby"
      :class="context.slots.value.link()"
      :download="$props.download"
      :href="$props.href"
      :href-lang="$props.hrefLang"
      :is-disabled="isDisabled"
      :ping="$props.ping"
      :referrer-policy="$props.referrerPolicy"
      :rel="$props.rel"
      :target="$props.target"
      @click="onClick"
      @press="onPress"
    >
      <slot :is-current="isCurrent" :is-disabled="isDisabled" />
    </Link>

    <template v-if="!isCurrent">
      <IconChevronRight
        v-if="!context.separator.value"
        :class="context.slots.value.separator()"
        data-slot="breadcrumbs-separator"
      />
      <template v-else-if="isTextSeparator">{{ context.separator.value }}</template>
      <component
        :is="context.separator.value"
        v-else
        :class="context.slots.value.separator()"
        data-slot="breadcrumbs-separator"
      />
    </template>
  </li>
</template>
