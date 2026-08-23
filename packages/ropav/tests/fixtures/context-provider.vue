<script setup lang="ts" vapor>
import { provideGreetingContext } from "./context";
import ContextConsumer from "./context-consumer.vue";

const props = defineProps<{ greeting: string }>();

provideGreetingContext({ greeting: props.greeting });
</script>

<template>
  <ContextConsumer />
</template>
