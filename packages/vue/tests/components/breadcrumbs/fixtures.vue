<script setup lang="ts" vapor>
import type {BreadcrumbsRootProps} from "@/components/breadcrumbs";

import {BreadcrumbsItem, BreadcrumbsRoot} from "@/components/breadcrumbs";
import {I18nProvider} from "@/components/i18n-provider";

const props = defineProps<
  BreadcrumbsRootProps & {
    itemClass?: string;
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
    </BreadcrumbsRoot>
  </I18nProvider>
</template>
