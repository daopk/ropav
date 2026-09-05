<script setup lang="ts">
import {
  IconClose,
  IconPlus,
  Switch,
  SwitchContent,
  SwitchControl,
  SwitchIcon,
  SwitchThumb,
} from "ropav";
</script>

<template>
  <Switch default-selected>
    <SwitchContent>
      <SwitchControl>
        <SwitchThumb>
          <SwitchIcon>
            <IconPlus />
          </SwitchIcon>
        </SwitchThumb>
      </SwitchControl>
      Sync on save
    </SwitchContent>
  </Switch>

  <Switch>
    <SwitchContent>
      <SwitchControl>
        <SwitchThumb>
          <SwitchIcon>
            <IconClose />
          </SwitchIcon>
        </SwitchThumb>
      </SwitchControl>
      Do not disturb
    </SwitchContent>
  </Switch>
</template>
