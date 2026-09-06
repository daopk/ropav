<script setup lang="ts">
import {
  Button,
  Drawer,
  DrawerBackdrop,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerDialog,
  DrawerFooter,
  DrawerHandle,
  DrawerHeader,
  DrawerHeading,
} from "ropav";

const placements = ["bottom", "right"] as const;
</script>

<template>
  <Drawer v-for="placement in placements" :key="placement">
    <Button class="capitalize" variant="secondary">{{ placement }}</Button>

    <DrawerBackdrop>
      <DrawerContent :placement="placement">
        <DrawerDialog>
          <DrawerHandle />
          <DrawerHeader>
            <DrawerHeading>Filters</DrawerHeading>
          </DrawerHeader>
          <DrawerBody>
            <p class="text-sm text-muted">
              The handle is draggable, so the drawer can be dismissed by flicking it away.
            </p>
          </DrawerBody>
          <DrawerFooter>
            <DrawerClose><Button variant="tertiary">Reset</Button></DrawerClose>
            <DrawerClose><Button>Apply</Button></DrawerClose>
          </DrawerFooter>
        </DrawerDialog>
      </DrawerContent>
    </DrawerBackdrop>
  </Drawer>
</template>
