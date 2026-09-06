<script setup lang="ts">
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationNextIcon,
  PaginationPrevious,
  PaginationPreviousIcon,
  PaginationSummary,
} from "ropav";
</script>

<template>
  <Pagination aria-label="Search results">
    <PaginationSummary>Showing 21–40 of 312</PaginationSummary>

    <PaginationContent>
      <PaginationItem>
        <PaginationPrevious>
          <PaginationPreviousIcon />
          <span>Previous</span>
        </PaginationPrevious>
      </PaginationItem>

      <PaginationItem><PaginationLink>1</PaginationLink></PaginationItem>
      <PaginationItem><PaginationLink is-active>2</PaginationLink></PaginationItem>
      <PaginationItem><PaginationLink>3</PaginationLink></PaginationItem>
      <PaginationItem><PaginationEllipsis /></PaginationItem>
      <PaginationItem><PaginationLink>16</PaginationLink></PaginationItem>

      <PaginationItem>
        <PaginationNext>
          <span>Next</span>
          <PaginationNextIcon />
        </PaginationNext>
      </PaginationItem>
    </PaginationContent>
  </Pagination>
</template>
