<script setup lang="ts" vapor>
import { AlertDialog } from "@/components/alert-dialog";
import { ButtonRoot } from "@/components/button";

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
      <ButtonRoot>Delete account</ButtonRoot>
      <AlertDialog.Backdrop is-dismissable :is-keyboard-dismiss-disabled="false">
        <AlertDialog.Container>
          <AlertDialog.Dialog>
            <AlertDialog.Header>
              <AlertDialog.Heading>Delete account?</AlertDialog.Heading>
            </AlertDialog.Header>
            <AlertDialog.Body>This cannot be undone.</AlertDialog.Body>
          </AlertDialog.Dialog>
        </AlertDialog.Container>
      </AlertDialog.Backdrop>
    </AlertDialog>
  </div>
</template>
