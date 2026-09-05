<script setup lang="ts">
import type { ControlSpec } from "../../../playgrounds/types";

import { Input, Label, TextField } from "ropav";

defineProps<{ control: ControlSpec }>();

const value = defineModel<string | undefined>({ required: true });
</script>

<template>
  <TextField v-model:value="value" full-width size="sm">
    <Label>{{ control.name }}</Label>
    <Input />
  </TextField>
</template>
