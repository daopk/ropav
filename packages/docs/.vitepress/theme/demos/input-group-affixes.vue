<script setup lang="ts">
import {
  IconSearch,
  InputGroup,
  InputGroupInput,
  InputGroupPrefix,
  InputGroupSuffix,
  Label,
  TextField,
} from "ropav";
</script>

<template>
  <div class="stack">
    <TextField class="field" name="q">
      <Label>Search</Label>
      <InputGroup>
        <InputGroupPrefix>
          <IconSearch />
        </InputGroupPrefix>
        <InputGroupInput placeholder="Anything at all" />
      </InputGroup>
    </TextField>

    <TextField class="field" name="domain">
      <Label>Subdomain</Label>
      <InputGroup>
        <InputGroupInput placeholder="acme" />
        <InputGroupSuffix>.example.com</InputGroupSuffix>
      </InputGroup>
    </TextField>
  </div>
</template>

<style scoped>
.stack {
  display: flex;
  flex-direction: column;
  gap: calc(var(--rp-spacing) * 4);
}

.field {
  width: calc(var(--rp-spacing) * 72);
}
</style>
