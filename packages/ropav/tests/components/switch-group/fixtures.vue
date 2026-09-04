<script setup lang="ts" vapor>
import type { SwitchGroupProps } from "@/components/switch-group";

import { Switch, SwitchContent, SwitchControl, SwitchThumb } from "@/components/switch";
import { SwitchGroup } from "@/components/switch-group";

defineProps<
  SwitchGroupProps & {
    /** `id` of a form the switches submit with, for a group rendered outside it. */
    form?: string;
  }
>();

const items = [
  { label: "Allow Notifications", name: "notifications" },
  { label: "Marketing emails", name: "marketing" },
  { label: "Social media updates", name: "social" },
];
</script>

<template>
  <SwitchGroup :class="$props.class" :orientation="$props.orientation">
    <Switch
      v-for="item in items"
      :key="item.name"
      :default-selected="item.name === 'marketing'"
      :form="$props.form"
      :name="item.name"
    >
      <SwitchContent>
        <SwitchControl>
          <SwitchThumb />
        </SwitchControl>
        {{ item.label }}
      </SwitchContent>
    </Switch>
  </SwitchGroup>
</template>
