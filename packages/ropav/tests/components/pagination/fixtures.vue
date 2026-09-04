<script setup lang="ts" vapor>
import type { PaginationProps } from "@/components/pagination";

import {
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationNextIcon,
  PaginationPrevious,
  PaginationPreviousIcon,
  Pagination,
  PaginationSummary,
} from "@/components/pagination";

const props = defineProps<
  PaginationProps & {
    activePage?: number;
    isNextDisabled?: boolean;
    isPreviousDisabled?: boolean;
    onLinkClick?: (page: number) => void;
    onNextClick?: () => void;
    onPreviousClick?: () => void;
  }
>();
</script>

<template>
  <Pagination :class="props.class" :size="props.size">
    <PaginationSummary>1 to 4 of 12 results</PaginationSummary>
    <PaginationContent>
      <PaginationItem>
        <PaginationPrevious
          :is-disabled="props.isPreviousDisabled"
          @click="props.onPreviousClick?.()"
        >
          <PaginationPreviousIcon />
          Prev
        </PaginationPrevious>
      </PaginationItem>
      <PaginationItem v-for="page of [1, 2, 3]" :key="page">
        <PaginationLink
          :is-active="page === (props.activePage ?? 1)"
          @click="props.onLinkClick?.(page)"
        >
          {{ page }}
        </PaginationLink>
      </PaginationItem>
      <PaginationItem>
        <PaginationEllipsis />
      </PaginationItem>
      <PaginationItem>
        <PaginationNext :is-disabled="props.isNextDisabled" @click="props.onNextClick?.()">
          Next
          <PaginationNextIcon />
        </PaginationNext>
      </PaginationItem>
    </PaginationContent>
  </Pagination>
</template>
