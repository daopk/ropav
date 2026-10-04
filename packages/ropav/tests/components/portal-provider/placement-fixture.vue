<script setup lang="ts" vapor>
import type { PortalProviderPlacementFixtureProps } from "./fixtures.types";

import { Button } from "@/components/button";
import { Popover, PopoverContent, PopoverDialog, PopoverHeading } from "@/components/popover";
import { PortalProvider } from "@/components/portal-provider";
import { Tooltip, TooltipContent } from "@/components/tooltip";

const props = withDefaults(defineProps<PortalProviderPlacementFixtureProps>(), {
  container: undefined,
  open: undefined,
  popoverTriggerStyle: undefined,
  root: undefined,
  tooltipTriggerStyle: undefined,
});
</script>

<template>
  <PortalProvider :container="props.container" :root="props.root">
    <Popover :is-open="props.open === 'popover'">
      <Button :style="props.popoverTriggerStyle">Open popover</Button>
      <PopoverContent>
        <PopoverDialog style="width: 240px">
          <PopoverHeading>Popover</PopoverHeading>
          <p>Enough content to make the popover taller than the room below its trigger.</p>
        </PopoverDialog>
      </PopoverContent>
    </Popover>
    <Tooltip :is-open="props.open === 'tooltip'">
      <Button :style="props.tooltipTriggerStyle">Tooltip trigger</Button>
      <TooltipContent>Tip</TooltipContent>
    </Tooltip>
  </PortalProvider>
</template>
