<script setup lang="ts">
import { FieldError, Input, Label, TextField } from "ropav";
</script>

<template>
  <TextField class="w-72" is-invalid name="email">
    <Label>Email address</Label>
    <Input default-value="not-an-address" type="email" />
    <FieldError>Enter an address in the form name@example.com.</FieldError>
  </TextField>
</template>
