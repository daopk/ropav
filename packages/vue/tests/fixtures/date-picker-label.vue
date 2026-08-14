<script setup lang="ts" vapor>
import {useFieldIdsContext} from "@/composables/use-field-ids";

// A separate component so the id is claimed the way a real `Label` claims it: from a child of the
// container that provided the context, not from the container itself.
const fieldIds = useFieldIdsContext();
const id = fieldIds?.claimLabelId();
</script>

<template>
  <span :id="id" data-slot="date-picker-label">Appointment</span>
</template>
