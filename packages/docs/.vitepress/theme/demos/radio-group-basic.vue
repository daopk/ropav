<script setup lang="ts">
import {
  Description,
  Label,
  Radio,
  RadioContent,
  RadioControl,
  RadioGroup,
  RadioIndicator,
} from "ropav";

const plans = [
  { id: "free", label: "Free" },
  { id: "premium", label: "Premium" },
  { id: "team", label: "Team" },
];
</script>

<template>
  <RadioGroup default-value="premium" name="plan">
    <Label>Plan</Label>
    <Description>Change it whenever you like.</Description>

    <Radio v-for="plan in plans" :key="plan.id" :value="plan.id">
      <RadioContent>
        <RadioControl>
          <RadioIndicator />
        </RadioControl>
        {{ plan.label }}
      </RadioContent>
    </Radio>
  </RadioGroup>
</template>
