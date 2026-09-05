<script setup lang="ts">
import { Checkbox, CheckboxContent, CheckboxControl, CheckboxIndicator } from "ropav";
</script>

<template>
  <div class="flex flex-col gap-3">
    <Checkbox
      v-for="state in ['unchecked', 'checked', 'mixed'] as const"
      :key="state"
      :is-indeterminate="state === 'mixed'"
      :is-selected="state === 'checked'"
    >
      <CheckboxContent>
        <CheckboxControl>
          <CheckboxIndicator />
        </CheckboxControl>
        {{ state }}
      </CheckboxContent>
    </Checkbox>
  </div>
</template>
