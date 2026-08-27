<script setup lang="ts" vapor>
import { ref } from "vue";

import {
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationNextIcon,
  PaginationPrevious,
  PaginationPreviousIcon,
  PaginationRoot,
} from "@/components/pagination";

/**
 * Owns the page it is showing, unlike `fixtures.vue`, which takes it as a prop.
 *
 * That is the whole reason this exists: a press has to land on a control whose own state the press
 * then changes, so the re-render arrives in the middle of the dispatch that caused it. A fixture
 * that only reports the click leaves the DOM exactly as the press found it.
 */
const props = defineProps<{ pages?: number[]; onPageChange?: (page: number) => void }>();

const pages = props.pages ?? [1, 2, 3];
const current = ref(pages[0]!);

const goTo = (page: number) => {
  current.value = page;
  props.onPageChange?.(page);
};

const step = (offset: number) => {
  const next = pages[pages.indexOf(current.value) + offset];

  if (next !== undefined) goTo(next);
};
</script>

<template>
  <PaginationRoot>
    <PaginationContent>
      <PaginationItem>
        <PaginationPrevious :is-disabled="current === pages[0]" @click="step(-1)">
          <PaginationPreviousIcon />
          Prev
        </PaginationPrevious>
      </PaginationItem>
      <PaginationItem v-for="page of pages" :key="page">
        <PaginationLink :is-active="page === current" @click="goTo(page)">
          {{ page }}
        </PaginationLink>
      </PaginationItem>
      <PaginationItem>
        <PaginationNext :is-disabled="current === pages.at(-1)" @click="step(1)">
          Next
          <PaginationNextIcon />
        </PaginationNext>
      </PaginationItem>
    </PaginationContent>
  </PaginationRoot>
</template>
