<script setup lang="ts">
import { Switch, SwitchContent, SwitchControl, SwitchGroup, SwitchThumb } from "ropav";

const settings = ["Email", "Push", "SMS"];
</script>

<template>
  <SwitchGroup orientation="horizontal">
    <Switch v-for="setting in settings" :key="setting" :name="setting.toLowerCase()" value="on">
      <SwitchContent>
        <SwitchControl>
          <SwitchThumb />
        </SwitchControl>
        {{ setting }}
      </SwitchContent>
    </Switch>
  </SwitchGroup>
</template>
