<script setup lang="ts">
import type { ControlSpec } from "../../../playgrounds/types";

import { Switch, SwitchContent, SwitchControl, SwitchThumb } from "ropav";

defineProps<{ control: ControlSpec }>();

const selected = defineModel<boolean | undefined>({ required: true });
</script>

<template>
  <Switch v-model:is-selected="selected" size="sm">
    <SwitchContent>
      <SwitchControl><SwitchThumb /></SwitchControl>
      {{ control.name }}
    </SwitchContent>
  </Switch>
</template>
