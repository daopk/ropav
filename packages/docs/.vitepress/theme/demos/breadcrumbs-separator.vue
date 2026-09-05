<script setup lang="ts">
import { Breadcrumbs, BreadcrumbsItem } from "ropav";
</script>

<template>
  <Breadcrumbs separator="/">
    <BreadcrumbsItem href="#">Home</BreadcrumbsItem>
    <BreadcrumbsItem href="#">Products</BreadcrumbsItem>
    <BreadcrumbsItem>Laptop</BreadcrumbsItem>
  </Breadcrumbs>
</template>
