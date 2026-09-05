<script setup lang="ts">
import { Button } from "ropav";
import { ref } from "vue";

const isPending = ref(false);

const save = () => {
  isPending.value = true;
  setTimeout(() => (isPending.value = false), 2000);
};
</script>

<template>
  <Button :is-pending="isPending" @click="save">Save changes</Button>
  <Button is-disabled variant="secondary">Disabled</Button>
</template>
