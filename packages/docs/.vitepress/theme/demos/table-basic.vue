<script setup lang="ts">
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableContent,
  TableHeader,
  TableRow,
  TableScrollContainer,
} from "ropav";

const columns = [
  { id: "name", isRowHeader: true, name: "Name" },
  { id: "role", name: "Role" },
  { id: "joined", name: "Joined" },
];

const people = [
  { id: "1", joined: "2024", name: "Ada Lovelace", role: "Engineering" },
  { id: "2", joined: "2025", name: "Grace Hopper", role: "Engineering" },
  { id: "3", joined: "2026", name: "Katherine Johnson", role: "Research" },
];
</script>

<template>
  <div class="w-full max-w-2xl">
    <Table>
      <TableScrollContainer>
        <TableContent aria-label="Team" class="min-w-[480px]">
          <TableHeader>
            <TableColumn
              v-for="column in columns"
              :id="column.id"
              :key="column.id"
              :is-row-header="column.isRowHeader"
            >
              {{ column.name }}
            </TableColumn>
          </TableHeader>

          <TableBody>
            <TableRow v-for="person in people" :id="person.id" :key="person.id">
              <TableCell v-for="column in columns" :key="column.id">
                {{ person[column.id as keyof typeof person] }}
              </TableCell>
            </TableRow>
          </TableBody>
        </TableContent>
      </TableScrollContainer>
    </Table>
  </div>
</template>
