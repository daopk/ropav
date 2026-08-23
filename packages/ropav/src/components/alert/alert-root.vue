<script setup lang="ts" vapor>
import type {AlertRootProps} from "./alert.types";

import {alertVariants} from "@heroui/styles";
import {computed} from "vue";

import {composeSlotClassName} from "../../utils/compose";
import {provideSurfaceContext} from "../surface";

import {provideAlertContext} from "./alert.context";

const props = defineProps<AlertRootProps>();

defineSlots<{default?: () => unknown}>();

const slots = computed(() => alertVariants({status: props.status}));

provideAlertContext({slots, status: computed(() => props.status)});

// An alert is a surface in its own right, so descendants use their default on-surface colours
// rather than inheriting the surface behind the alert.
provideSurfaceContext({variant: computed(() => "default" as const)});
</script>

<template>
  <div :class="composeSlotClassName(slots.base, props.class)" data-slot="alert-root">
    <slot />
  </div>
</template>
