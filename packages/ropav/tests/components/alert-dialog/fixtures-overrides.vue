<script setup lang="ts" vapor>
import {
  AlertDialog,
  AlertDialogBackdrop,
  AlertDialogBody,
  AlertDialogContainer,
  AlertDialogDialog,
  AlertDialogHeader,
  AlertDialogHeading,
} from "@/components/alert-dialog";
import { Button } from "@/components/button";

/**
 * Both dismissal routes opened the way a caller actually writes them.
 *
 * `is-dismissable` is a bare attribute, which Vue casts from an empty string to `true` — and that
 * cast is the whole point: a default of `false` reached through `?? false` would swallow it, and the
 * dialog would silently keep refusing to be dismissed. `is-keyboard-dismiss-disabled` is bound to a
 * literal `false` for the same reason in the other direction.
 */
</script>

<template>
  <div>
    <button id="outside" type="button">Outside</button>
    <AlertDialog default-open>
      <Button>Delete account</Button>
      <AlertDialogBackdrop is-dismissable :is-keyboard-dismiss-disabled="false">
        <AlertDialogContainer>
          <AlertDialogDialog>
            <AlertDialogHeader>
              <AlertDialogHeading>Delete account?</AlertDialogHeading>
            </AlertDialogHeader>
            <AlertDialogBody>This cannot be undone.</AlertDialogBody>
          </AlertDialogDialog>
        </AlertDialogContainer>
      </AlertDialogBackdrop>
    </AlertDialog>
  </div>
</template>
