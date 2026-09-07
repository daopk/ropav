<script setup lang="ts">
import {
  Button,
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
} from "ropav";
</script>

<template>
  <Modal>
    <Button variant="secondary">Open</Button>

    <ModalBackdrop>
      <ModalContainer>
        <ModalDialog class="dialog">
          <ModalCloseTrigger />

          <ModalHeader>
            <ModalHeading>Delete this project?</ModalHeading>
          </ModalHeader>

          <ModalBody>Everything in it goes with it. This cannot be undone.</ModalBody>

          <ModalFooter>
            <ModalClose>
              <Button variant="tertiary">Cancel</Button>
            </ModalClose>
            <ModalClose>
              <Button variant="danger">Delete</Button>
            </ModalClose>
          </ModalFooter>
        </ModalDialog>
      </ModalContainer>
    </ModalBackdrop>
  </Modal>
</template>

<style scoped>
.dialog {
  @media (width >= 40rem) {
    max-width: 360px;
  }
}
</style>
