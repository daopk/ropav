<script setup lang="ts">
import type { CollectionKey } from "ropav";

import {
  Button,
  Drawer,
  DrawerBackdrop,
  DrawerBody,
  DrawerContent,
  DrawerDialog,
  DrawerFooter,
  DrawerHandle,
  DrawerHeader,
  DrawerHeading,
  Dropdown,
  DropdownMenu,
  DropdownPopover,
  Label,
  MenuItem,
  Modal,
  ModalBackdrop,
  ModalBody,
  ModalClose,
  ModalCloseTrigger,
  ModalContainer,
  ModalDialog,
  ModalFooter,
  ModalHeader,
  ModalHeading,
  Switch,
  SwitchContent,
  SwitchControl,
  SwitchGroup,
  SwitchThumb,
  ToastProvider,
  ToastQueue,
} from "ropav";
import { shallowRef } from "vue";

const queue = new ToastQueue({ maxVisibleToasts: 3 });

const isDrawerOpen = shallowRef(false);

const say = (title: string, variant: "danger" | "default" | "success" = "default") => {
  queue.add({ title, variant });
};

const settings = [
  { label: "Email me on every reply", name: "replies" },
  { label: "Weekly digest", name: "digest" },
];

// A menu reports which item was chosen; the items themselves do not each need a handler.
const onAction = (key: CollectionKey) => {
  say(`Chose ${String(key)}`);
};

const apply = () => {
  isDrawerOpen.value = false;
  say("Preferences saved", "success");
};
</script>

<template>
  <div class="row">
    <Dropdown>
      <Button variant="secondary">Actions</Button>

      <DropdownPopover>
        <DropdownMenu aria-label="Document actions" @action="onAction">
          <MenuItem id="rename" text-value="Rename">
            <Label>Rename</Label>
          </MenuItem>
          <MenuItem id="duplicate" text-value="Duplicate">
            <Label>Duplicate</Label>
          </MenuItem>
        </DropdownMenu>
      </DropdownPopover>
    </Dropdown>

    <Drawer v-model:is-open="isDrawerOpen">
      <Button variant="secondary">Preferences</Button>

      <DrawerBackdrop>
        <DrawerContent placement="right">
          <DrawerDialog>
            <DrawerHandle />

            <DrawerHeader>
              <DrawerHeading>Preferences</DrawerHeading>
            </DrawerHeader>

            <DrawerBody>
              <SwitchGroup>
                <Switch
                  v-for="setting in settings"
                  :key="setting.name"
                  :name="setting.name"
                  value="on"
                >
                  <SwitchContent>
                    <SwitchControl>
                      <SwitchThumb />
                    </SwitchControl>
                    {{ setting.label }}
                  </SwitchContent>
                </Switch>
              </SwitchGroup>
            </DrawerBody>

            <DrawerFooter>
              <Button variant="tertiary" @click="isDrawerOpen = false">Cancel</Button>
              <Button @click="apply">Apply</Button>
            </DrawerFooter>
          </DrawerDialog>
        </DrawerContent>
      </DrawerBackdrop>
    </Drawer>

    <Modal>
      <Button variant="danger-soft">Delete</Button>

      <ModalBackdrop>
        <ModalContainer>
          <ModalDialog class="dialog">
            <ModalCloseTrigger />

            <ModalHeader>
              <ModalHeading>Delete this document?</ModalHeading>
            </ModalHeader>

            <ModalBody>Everything in it goes with it. This cannot be undone.</ModalBody>

            <ModalFooter>
              <ModalClose>
                <Button variant="tertiary">Cancel</Button>
              </ModalClose>
              <ModalClose>
                <Button variant="danger" @click="say('Document deleted', 'danger')">Delete</Button>
              </ModalClose>
            </ModalFooter>
          </ModalDialog>
        </ModalContainer>
      </ModalBackdrop>
    </Modal>

    <ToastProvider placement="bottom" :queue />
  </div>
</template>

<style scoped>
.row {
  display: flex;
  flex-wrap: wrap;
  gap: calc(var(--rp-spacing) * 3);
  align-items: center;
}

.dialog {
  @media (width >= 40rem) {
    max-width: 360px;
  }
}
</style>
