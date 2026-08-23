<script setup lang="ts" vapor>
import type {CardRootProps} from "./card.types";

import {cardVariants} from "@ropav/styles";
import {computed} from "vue";

import {provideSurfaceContext, useSurfaceContext} from "../surface";

import {provideCardContext} from "./card.context";

const props = withDefaults(defineProps<CardRootProps>(), {variant: "default"});

defineSlots<{default?: () => unknown}>();

const slots = computed(() => cardVariants({variant: props.variant}));

provideCardContext({slots});

// Only resolves to an ancestor, since `inject` cannot see the component's own `provide`.
const ancestorSurface = useSurfaceContext();

/**
 * A card is a surface, so anything inside it that picks its colours from the surface behind
 * it reads the card rather than the page.
 *
 * A transparent card is not a surface — it shows whatever is behind it — so it forwards the
 * surface it is sitting on instead. React expresses that by not rendering the provider at
 * all; here the choice has to live inside the computed, because `provide` runs once and the
 * variant can change afterwards.
 */
provideSurfaceContext({
  variant: computed(() =>
    props.variant === "transparent" ? ancestorSurface?.variant.value : props.variant,
  ),
});
</script>

<template>
  <div :class="slots.base({class: props.class})" data-slot="card">
    <slot />
  </div>
</template>
