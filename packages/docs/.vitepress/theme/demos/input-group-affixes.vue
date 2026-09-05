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
  <div class="flex flex-col gap-4">
    <TextField class="w-72" name="q">
      <Label>Search</Label>
      <InputGroup>
        <InputGroupPrefix>
          <IconSearch />
        </InputGroupPrefix>
        <InputGroupInput placeholder="Anything at all" />
      </InputGroup>
    </TextField>

    <TextField class="w-72" name="domain">
      <Label>Subdomain</Label>
      <InputGroup>
        <InputGroupInput placeholder="acme" />
        <InputGroupSuffix>.example.com</InputGroupSuffix>
      </InputGroup>
    </TextField>
  </div>
</template>
