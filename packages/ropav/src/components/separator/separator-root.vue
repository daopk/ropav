<script setup lang="ts" vapor>
import type { SeparatorRootProps } from "./separator.types";

import { separatorVariants } from "@ropav/styles";
import { computed } from "vue";

import { useSeparatorContext } from "./separator.context";

// `orientation` declares an explicit `undefined` default so an absent prop stays absent and
// can fall through to the container's axis. Vue would otherwise read "no prop" as an
// explicit `"horizontal"`, and a rule inside a toolbar could never inherit its axis.
const props = withDefaults(defineProps<SeparatorRootProps>(), { orientation: undefined });

const context = useSeparatorContext();

const resolvedOrientation = computed(
  () => props.orientation ?? context?.orientation?.value ?? "horizontal",
);

const styles = computed(() =>
  separatorVariants({
    class: props.class,
    orientation: resolvedOrientation.value,
    variant: props.variant,
  }),
);

const isVertical = computed(() => resolvedOrientation.value === "vertical");

// A vertical rule can never be an `hr`, and a horizontal one stops being one whenever the
// container lays its own children out — see `elementType` on the context.
const isDiv = computed(() => isVertical.value || context?.elementType === "div");
</script>

<template>
  <!--
    Both branches spell out `role="separator"` even though an `hr` implies it: React Aria
    emits it on the `hr` too, and matching it keeps the rendered markup identical across the
    two builds. `aria-orientation` is the opposite — horizontal is the ARIA default, so only
    the vertical branch declares it.
  -->
  <div
    v-if="isDiv"
    :aria-orientation="isVertical ? 'vertical' : undefined"
    :class="styles"
    :data-orientation="resolvedOrientation"
    data-slot="separator"
    role="separator"
  />
  <hr v-else :class="styles" data-orientation="horizontal" data-slot="separator" role="separator" />
</template>
