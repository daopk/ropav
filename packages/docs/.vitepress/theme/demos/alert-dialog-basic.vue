<script setup lang="ts">
import {
  AlertDialog,
  AlertDialogBackdrop,
  AlertDialogBody,
  AlertDialogClose,
  AlertDialogContainer,
  AlertDialogDialog,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogHeading,
  AlertDialogIcon,
  Button,
} from "ropav";
</script>

<template>
  <AlertDialog>
    <Button variant="danger">Delete project</Button>

    <AlertDialogBackdrop>
      <AlertDialogContainer>
        <AlertDialogDialog class="sm:max-w-[400px]">
          <AlertDialogHeader>
            <AlertDialogIcon status="danger" />
            <AlertDialogHeading>Delete this project?</AlertDialogHeading>
          </AlertDialogHeader>

          <AlertDialogBody>
            <p class="text-muted text-sm">Everything in it goes with it. This cannot be undone.</p>
          </AlertDialogBody>

          <AlertDialogFooter>
            <AlertDialogClose><Button variant="tertiary">Cancel</Button></AlertDialogClose>
            <AlertDialogClose><Button variant="danger">Delete</Button></AlertDialogClose>
          </AlertDialogFooter>
        </AlertDialogDialog>
      </AlertDialogContainer>
    </AlertDialogBackdrop>
  </AlertDialog>
</template>
