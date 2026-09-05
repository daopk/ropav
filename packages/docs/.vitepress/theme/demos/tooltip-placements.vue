<script setup lang="ts">
import { Button, Tooltip, TooltipArrow, TooltipContent } from "ropav";

const placements = ["top", "right", "bottom", "left"] as const;
</script>

<template>
  <Tooltip v-for="placement in placements" :key="placement" :delay="0">
    <Button variant="secondary">{{ placement }}</Button>
    <TooltipContent :placement>
      <TooltipArrow />
      Placed {{ placement }}
    </TooltipContent>
  </Tooltip>
</template>
