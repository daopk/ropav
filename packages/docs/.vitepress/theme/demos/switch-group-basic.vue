<script setup lang="ts">
import { Switch, SwitchContent, SwitchControl, SwitchGroup, SwitchThumb } from "ropav";

const settings = [
  { label: "Allow notifications", name: "notifications" },
  { label: "Marketing emails", name: "marketing" },
  { label: "Social media updates", name: "social" },
];
</script>

<template>
  <SwitchGroup>
    <Switch v-for="setting in settings" :key="setting.name" :name="setting.name" value="on">
      <SwitchContent>
        <SwitchControl>
          <SwitchThumb />
        </SwitchControl>
        {{ setting.label }}
      </SwitchContent>
    </Switch>
  </SwitchGroup>
</template>
