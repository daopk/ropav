<script setup lang="ts" vapor>
import type {PasswordManagerBadgeHostProps} from "./password-manager-badge.types";

import {shallowRef} from "vue";

import {usePasswordManagerBadge} from "@/composables/use-password-manager-badge";

// The composable has to run inside a component: its polling and its retries hang off effects,
// which need a scope to be cleaned up with.
const props = withDefaults(defineProps<PasswordManagerBadgeHostProps>(), {isFocused: false});

const container = shallowRef<HTMLElement | null>(null);
const input = shallowRef<HTMLInputElement | null>(null);

const setContainer = (element: unknown) => {
  container.value = element instanceof HTMLElement ? element : null;
};

const setInput = (element: unknown) => {
  input.value = element instanceof HTMLInputElement ? element : null;
};

const badge = usePasswordManagerBadge({
  container,
  input,
  isFocused: () => props.isFocused,
  pushPasswordManagerStrategy: () => props.pushPasswordManagerStrategy,
});

props.onReady(badge);
</script>

<template>
  <div :ref="setContainer" data-testid="container">
    <input :ref="setInput" data-testid="control" />
  </div>
</template>
