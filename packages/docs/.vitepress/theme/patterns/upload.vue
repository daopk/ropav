<script setup lang="ts">
import {
  Alert,
  AlertContent,
  AlertDescription,
  AlertIndicator,
  AlertTitle,
  CloseButton,
  DropZone,
  DropZoneTrigger,
  EmptyState,
  Label,
  ProgressBar,
  ProgressBarFill,
  ProgressBarOutput,
  ProgressBarTrack,
} from "ropav";
import { onBeforeUnmount, shallowRef, triggerRef } from "vue";

const MAX_BYTES = 2 * 1024 * 1024;

interface Upload {
  id: number;
  name: string;
  progress: number;
}

const uploads = shallowRef<Upload[]>([]);
const refused = shallowRef<string[]>([]);

const timers = new Map<number, ReturnType<typeof setInterval>>();

const stop = (id: number) => {
  clearInterval(timers.get(id));
  timers.delete(id);
};

onBeforeUnmount(() => {
  for (const id of [...timers.keys()]) stop(id);
});

/* Stands in for the request. Everything above it is the part worth copying. */
const send = (upload: Upload) => {
  timers.set(
    upload.id,
    setInterval(() => {
      upload.progress = Math.min(100, upload.progress + 20);
      triggerRef(uploads);

      if (upload.progress === 100) stop(upload.id);
    }, 400),
  );
};

const onSelect = (files: File[]) => {
  /*
   * `accept` has already dropped the wrong types without saying so. A size cap is not something it
   * can express, which is why this half is the half that can explain itself.
   */
  const tooBig = files.filter((file) => file.size > MAX_BYTES);
  const taken = files.filter((file) => file.size <= MAX_BYTES);

  refused.value = tooBig.map((file) => file.name);

  const added = taken.map((file, index) => ({
    id: Date.now() + index,
    name: file.name,
    progress: 0,
  }));

  uploads.value = [...uploads.value, ...added];
  added.forEach(send);
};

const remove = (id: number) => {
  stop(id);
  uploads.value = uploads.value.filter((upload) => upload.id !== id);
};
</script>

<template>
  <div class="upload">
    <DropZone
      accept="image/*,.pdf"
      aria-label="Upload attachments"
      class="zone"
      multiple
      @select="onSelect"
    >
      <template #default="{ status }">
        <p v-if="status === 'reject'">Images and PDFs only</p>
        <p v-else>Drop images or PDFs here, or <DropZoneTrigger>browse</DropZoneTrigger></p>
        <p class="hint">Up to 2 MB each</p>
      </template>
    </DropZone>

    <Alert v-if="refused.length > 0" status="warning">
      <AlertIndicator />
      <AlertContent>
        <AlertTitle>Some files were too large</AlertTitle>
        <AlertDescription>
          {{ refused.join(", ") }} — each file has to be under 2 MB.
        </AlertDescription>
      </AlertContent>
      <CloseButton aria-label="Dismiss" @click="refused = []" />
    </Alert>

    <EmptyState v-if="uploads.length === 0">Nothing uploaded yet.</EmptyState>

    <ul v-else class="list">
      <li v-for="upload in uploads" :key="upload.id">
        <div class="row">
          <ProgressBar class="bar" :value="upload.progress">
            <Label>{{ upload.name }}</Label>
            <ProgressBarOutput />
            <ProgressBarTrack><ProgressBarFill /></ProgressBarTrack>
          </ProgressBar>

          <CloseButton :aria-label="`Remove ${upload.name}`" @click="remove(upload.id)" />
        </div>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.upload {
  display: flex;
  max-width: var(--rp-container-md);
  flex-direction: column;
  gap: calc(var(--rp-spacing) * 4);
}

.hint {
  color: var(--rp-muted);
  font-size: var(--rp-text-sm);
  line-height: var(--rp-text-sm--line-height);
}

.list {
  display: flex;
  flex-direction: column;
  padding: 0;
  margin: 0;
  gap: calc(var(--rp-spacing) * 4);
  list-style: none;
}

.row {
  display: flex;
  gap: calc(var(--rp-spacing) * 3);
  align-items: end;
}

.bar {
  flex: 1;
  min-width: 0;
}
</style>
