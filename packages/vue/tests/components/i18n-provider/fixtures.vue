<script setup lang="ts" vapor>
import type {I18nProviderFixtureProps} from "./fixtures.types";

import {I18nProvider} from "@/components/i18n-provider";

import LocaleHost from "../../fixtures/locale-host.vue";

const props = defineProps<I18nProviderFixtureProps>();
</script>

<template>
  <I18nProvider :locale="props.locale">
    <LocaleHost :on-ready="props.onReady" />
  </I18nProvider>
</template>
