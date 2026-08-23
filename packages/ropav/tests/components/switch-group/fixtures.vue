<script setup lang="ts" vapor>
import type { SwitchGroupRootProps } from "@/components/switch-group";

import { Switch } from "@/components/switch";
import { SwitchGroup } from "@/components/switch-group";

defineProps<
  SwitchGroupRootProps & {
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
      <Switch.Content>
        <Switch.Control>
          <Switch.Thumb />
        </Switch.Control>
        {{ item.label }}
      </Switch.Content>
    </Switch>
  </SwitchGroup>
</template>
