<script setup lang="ts">
import { Button, ToastProvider, ToastQueue } from "ropav";

const queue = new ToastQueue({ maxVisibleToasts: 3 });

const show = (variant: "danger" | "default" | "success") => {
  queue.add({
    description: "Everything after the title goes here.",
    title: variant === "danger" ? "Sync failed" : "Saved",
    variant,
  });
};
</script>

<template>
  <div class="row">
    <Button size="sm" variant="secondary" @click="show('default')">Default</Button>
    <Button size="sm" variant="secondary" @click="show('success')">Success</Button>
    <Button size="sm" variant="danger-soft" @click="show('danger')">Danger</Button>

    <ToastProvider placement="bottom" :queue />
  </div>
</template>

<style scoped>
.row {
  display: flex;
  flex-wrap: wrap;
  gap: calc(var(--spacing) * 3);
}
</style>
