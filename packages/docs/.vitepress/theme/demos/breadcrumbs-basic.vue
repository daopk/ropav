<script setup lang="ts">
import { Breadcrumbs, BreadcrumbsItem } from "ropav";

const trail = [
  { href: "#", name: "Home" },
  { href: "#", name: "Products" },
  { href: "#", name: "Electronics" },
  { name: "Laptop" },
];
</script>

<template>
  <Breadcrumbs>
    <BreadcrumbsItem v-for="crumb in trail" :key="crumb.name" :href="crumb.href">
      {{ crumb.name }}
    </BreadcrumbsItem>
  </Breadcrumbs>
</template>
