<script setup lang="ts">
import { Input, Label, TextField } from "ropav";

const sizes = ["sm", "md", "lg"] as const;
</script>

<template>
  <div class="flex flex-col gap-4">
    <TextField v-for="size in sizes" :key="size" :size="size">
      <Label class="capitalize">{{ size }}</Label>
      <Input class="w-64" :placeholder="`A ${size} control`" />
    </TextField>
  </div>
</template>
