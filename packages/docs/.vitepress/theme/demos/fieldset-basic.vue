<script setup lang="ts">
import {
  Description,
  FieldGroup,
  Fieldset,
  FieldsetActions,
  FieldsetLegend,
  Button,
  Input,
  Label,
  TextField,
} from "ropav";
</script>

<template>
  <Fieldset class="w-full max-w-md">
    <FieldsetLegend>Billing address</FieldsetLegend>
    <Description>Where the invoice is sent.</Description>

    <FieldGroup>
      <TextField name="street">
        <Label>Street</Label>
        <Input placeholder="221B Baker Street" />
      </TextField>
      <TextField name="city">
        <Label>City</Label>
        <Input placeholder="London" />
      </TextField>
    </FieldGroup>

    <FieldsetActions>
      <Button variant="secondary">Cancel</Button>
      <Button>Save</Button>
    </FieldsetActions>
  </Fieldset>
</template>
