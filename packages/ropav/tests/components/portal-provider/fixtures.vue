<script setup lang="ts" vapor>
import type { PortalProviderFixtureProps } from "./fixtures.types";

import { Button } from "@/components/button";
import {
  Modal,
  ModalBackdrop,
  ModalContainer,
  ModalDialog,
  ModalHeading,
} from "@/components/modal";
import { Popover, PopoverContent, PopoverDialog, PopoverHeading } from "@/components/popover";
import { PortalProvider } from "@/components/portal-provider";
import { Tooltip, TooltipContent } from "@/components/tooltip";

const props = withDefaults(defineProps<PortalProviderFixtureProps>(), {
  container: undefined,
  open: undefined,
  root: undefined,
});
</script>

<template>
  <PortalProvider :container="props.container" :root="props.root">
    <Modal :default-open="props.open === 'modal'">
      <Button>Open modal</Button>
      <ModalBackdrop>
        <ModalContainer>
          <ModalDialog>
            <ModalHeading>Modal</ModalHeading>
          </ModalDialog>
        </ModalContainer>
      </ModalBackdrop>
    </Modal>
    <Popover :default-open="props.open === 'popover'">
      <Button>Open popover</Button>
      <PopoverContent>
        <PopoverDialog>
          <PopoverHeading>Popover</PopoverHeading>
        </PopoverDialog>
      </PopoverContent>
    </Popover>
    <Tooltip :default-open="props.open === 'tooltip'">
      <Button>Tooltip trigger</Button>
      <TooltipContent>Tip</TooltipContent>
    </Tooltip>
  </PortalProvider>
</template>
