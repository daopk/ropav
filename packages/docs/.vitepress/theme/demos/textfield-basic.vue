<script setup lang="ts">
import { Description, Input, Label, TextField } from "ropav";
</script>

<template>
  <TextField class="w-72" name="email">
    <Label>Email address</Label>
    <Input placeholder="name@example.com" type="email" />
    <Description>We only use this to send receipts.</Description>
  </TextField>
</template>
