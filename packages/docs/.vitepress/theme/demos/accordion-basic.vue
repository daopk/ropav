<script setup lang="ts">
import {
  Accordion,
  AccordionBody,
  AccordionHeading,
  AccordionIndicator,
  AccordionItem,
  AccordionPanel,
  AccordionTrigger,
} from "ropav";

const questions = [
  {
    answer: "Every component ships its own stylesheet, and the theme decides the colours.",
    id: "styling",
    title: "How is it styled?",
  },
  {
    answer: "One tab stop per control, and the keyboard interactions the ARIA pattern asks for.",
    id: "keyboard",
    title: "What about the keyboard?",
  },
  {
    answer: "Server rendering works, and the client hydrates what the server drew.",
    id: "ssr",
    title: "Does it render on the server?",
  },
] as const;
</script>

<template>
  <Accordion class="panel" :default-expanded-keys="['styling']">
    <AccordionItem v-for="question in questions" :id="question.id" :key="question.id">
      <AccordionHeading>
        <AccordionTrigger>
          {{ question.title }}
          <AccordionIndicator />
        </AccordionTrigger>
      </AccordionHeading>
      <AccordionPanel>
        <AccordionBody>{{ question.answer }}</AccordionBody>
      </AccordionPanel>
    </AccordionItem>
  </Accordion>
</template>

<style scoped>
.panel {
  width: 100%;
  max-width: var(--container-md);
}
</style>
