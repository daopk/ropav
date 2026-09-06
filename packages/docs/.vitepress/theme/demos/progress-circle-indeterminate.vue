<script setup lang="ts">
import {
  ProgressCircle,
  ProgressCircleFillCircle,
  ProgressCircleTrack,
  ProgressCircleTrackCircle,
} from "ropav";
</script>

<template>
  <ProgressCircle aria-label="Uploading" :value="60">
    <ProgressCircleTrack>
      <ProgressCircleTrackCircle />
      <ProgressCircleFillCircle />
    </ProgressCircleTrack>
  </ProgressCircle>

  <ProgressCircle aria-label="Contacting the server" is-indeterminate>
    <ProgressCircleTrack>
      <ProgressCircleTrackCircle />
      <ProgressCircleFillCircle />
    </ProgressCircleTrack>
  </ProgressCircle>
</template>
