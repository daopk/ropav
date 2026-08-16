<script setup lang="ts" vapor>
import type {BreadcrumbsRootProps} from "@/components/breadcrumbs";

import {BreadcrumbsItem, BreadcrumbsRoot} from "@/components/breadcrumbs";
import {I18nProvider} from "@/components/i18n-provider";

const props = defineProps<
  BreadcrumbsRootProps & {
    itemClass?: string;
    items?: readonly {href?: string; id: string; label: string}[];
    locale?: string;
    onAction?: (key: string | number) => void;
    onItemClick?: (event: MouseEvent) => void;
  }
>();
</script>

<template>
  <I18nProvider :locale="props.locale">
    <BreadcrumbsRoot
      :aria-label="props.ariaLabel"
      :aria-labelledby="props.ariaLabelledby"
      :class="props.class"
      data-testid="breadcrumbs"
      :is-disabled="props.isDisabled"
      :separator="props.separator"
      @action="props.onAction"
    >
      <template v-if="props.items">
        <BreadcrumbsItem
          v-for="item in props.items"
          :id="item.id"
          :key="item.id"
          :data-testid="item.id"
          :href="item.href"
        >
          {{ item.label }}
        </BreadcrumbsItem>
      </template>
      <template v-else>
        <BreadcrumbsItem
          id="home"
          :class="props.itemClass"
          data-testid="home"
          href="#home"
          @click="props.onItemClick"
        >
          Home
        </BreadcrumbsItem>
        <BreadcrumbsItem id="products" href="#products">Products</BreadcrumbsItem>
        <BreadcrumbsItem id="laptop">Laptop</BreadcrumbsItem>
      </template>
    </BreadcrumbsRoot>
  </I18nProvider>
</template>
