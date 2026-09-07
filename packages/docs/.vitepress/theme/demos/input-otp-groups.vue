<script setup lang="ts">
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot, Label } from "ropav";
</script>

<template>
  <div class="stack">
    <Label>Verification code</Label>
    <InputOTP aria-label="Verification code" default-value="042" :max-length="6">
      <InputOTPGroup>
        <InputOTPSlot :index="0" />
        <InputOTPSlot :index="1" />
        <InputOTPSlot :index="2" />
      </InputOTPGroup>
      <InputOTPSeparator />
      <InputOTPGroup>
        <InputOTPSlot :index="3" />
        <InputOTPSlot :index="4" />
        <InputOTPSlot :index="5" />
      </InputOTPGroup>
    </InputOTP>
  </div>
</template>

<style scoped>
.stack {
  display: flex;
  flex-direction: column;
  gap: calc(var(--rp-spacing) * 2);
}
</style>
