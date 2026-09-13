<script setup lang="ts">
import {
  Button,
  Checkbox,
  CheckboxContent,
  CheckboxControl,
  CheckboxIndicator,
  Description,
  FieldError,
  FieldGroup,
  Fieldset,
  FieldsetActions,
  FieldsetLegend,
  Form,
  Input,
  Label,
  ListBox,
  ListBoxItem,
  ListBoxItemIndicator,
  Select,
  SelectIndicator,
  SelectPopover,
  SelectTrigger,
  SelectValue,
  TextArea,
  TextField,
} from "ropav";
import { shallowRef } from "vue";

const plans = [
  { id: "starter", name: "Starter" },
  { id: "team", name: "Team" },
  { id: "enterprise", name: "Enterprise" },
];

const byName = (plan: { name: string }) => plan.name;

const serverErrors = shallowRef<Record<string, string>>({});

const validateSlug = (value: string) =>
  /^[a-z0-9-]*$/.test(value) ? null : "Lowercase letters, numbers and dashes only.";

const onSubmit = (event: Event) => {
  event.preventDefault();

  const data = new FormData(event.target as HTMLFormElement);

  // A fresh object each time, so the same field rejected twice reads as a new response.
  serverErrors.value = data.get("slug") === "acme" ? { slug: "That URL is taken." } : {};
};
</script>

<template>
  <Form
    class="form"
    validation-behavior="aria"
    :validation-errors="serverErrors"
    @submit="onSubmit"
  >
    <Fieldset>
      <FieldsetLegend>Workspace</FieldsetLegend>
      <Description>Everyone you invite lands here.</Description>

      <FieldGroup>
        <TextField is-required name="name">
          <Label>Name</Label>
          <Input placeholder="Acme Research" />
          <FieldError />
        </TextField>

        <TextField default-value="acme" is-required name="slug" :validate="validateSlug">
          <Label>URL</Label>
          <Input />
          <Description>Appears in every link to this workspace.</Description>
          <FieldError />
        </TextField>

        <Select
          full-width
          is-required
          :item-text-value="byName"
          :items="plans"
          name="plan"
          placeholder="Choose a plan"
        >
          <Label>Plan</Label>
          <SelectTrigger>
            <SelectValue />
            <SelectIndicator />
          </SelectTrigger>
          <SelectPopover>
            <ListBox>
              <ListBoxItem
                v-for="plan in plans"
                :id="plan.id"
                :key="plan.id"
                :text-value="plan.name"
              >
                {{ plan.name }}
                <ListBoxItemIndicator />
              </ListBoxItem>
            </ListBox>
          </SelectPopover>
          <FieldError />
        </Select>

        <TextField name="notes">
          <Label>Notes</Label>
          <TextArea full-width placeholder="Anything the team should know." rows="3" />
        </TextField>

        <Checkbox name="digest" value="weekly">
          <CheckboxContent>
            <CheckboxControl>
              <CheckboxIndicator />
            </CheckboxControl>
            Send a weekly digest
          </CheckboxContent>
        </Checkbox>
      </FieldGroup>

      <FieldsetActions>
        <Button type="reset" variant="secondary">Cancel</Button>
        <Button type="submit">Save</Button>
      </FieldsetActions>
    </Fieldset>
  </Form>
</template>

<style scoped>
.form {
  max-width: var(--rp-container-md);
}
</style>
