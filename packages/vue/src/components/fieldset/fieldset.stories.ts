import type {StoryMeta} from "../../utils/story-meta";
import type {StoryObj} from "@storybook/vue3";

import {shallowRef} from "vue";

import {Button} from "../button";
import {Description} from "../description";
import {FieldError} from "../field-error";
import {Form} from "../form";
import {Input} from "../input";
import {Label} from "../label";
import {TextArea} from "../textarea";
import {TextField} from "../textfield";

import {FieldGroup, Fieldset, FieldsetActions, FieldsetLegend, FieldsetRoot} from "./index";

import IconFloppyDisk from "~icons/gravity-ui/floppy-disk";

// Registered part by part: a story template is compiled at runtime, with no binding metadata to
// resolve `Fieldset.Legend` through, so dot notation cannot be used here.
const components = {
  Button,
  Description,
  FieldError,
  FieldGroup,
  FieldsetActions,
  FieldsetLegend,
  FieldsetRoot,
  Form,
  IconFloppyDisk,
  Input,
  Label,
  TextArea,
  TextField,
};

const meta: StoryMeta = {
  component: Fieldset,
  parameters: {
    layout: "centered",
  },
  title: "Components/Forms/Fieldset",
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    components,
    setup: () => {
      const submitted = shallowRef("");

      const onSubmit = (event: Event) => {
        event.preventDefault();

        const data = new FormData(event.target as HTMLFormElement);

        submitted.value = [...data.entries()].map(([key, value]) => key + ": " + value).join(", ");
      };

      return {onSubmit, submitted};
    },
    template: `
      <Form @submit="onSubmit">
        <FieldsetRoot class="w-96">
          <FieldsetLegend>Profile Settings</FieldsetLegend>
          <Description>Update your profile information.</Description>
          <FieldGroup>
            <TextField
              is-required
              name="name"
              :validate="(value) => (value.length < 3 ? 'Name must be at least 3 characters' : null)"
            >
              <Label>Name</Label>
              <Input placeholder="John Doe" />
              <FieldError />
            </TextField>
            <TextField is-required name="email" type="email">
              <Label>Email</Label>
              <Input placeholder="john@example.com" />
              <FieldError />
            </TextField>
            <TextField
              is-required
              name="bio"
              :validate="(value) => (value.length < 10 ? 'Bio must be at least 10 characters' : null)"
            >
              <Label>Bio</Label>
              <TextArea placeholder="Tell us about yourself..." />
              <Description>Minimum 10 characters</Description>
              <FieldError />
            </TextField>
          </FieldGroup>
          <FieldsetActions>
            <Button type="submit">
              <IconFloppyDisk />
              Save changes
            </Button>
            <Button type="reset" variant="tertiary">Cancel</Button>
          </FieldsetActions>
          <p v-if="submitted" class="text-sm text-muted">Form submitted — {{ submitted }}</p>
        </FieldsetRoot>
      </Form>
    `,
  }),
};

// Not a story `@heroui/react` has. The disabled cascade is the whole reason the component hands
// its state down through a context, and no story exercised it — the same gap the `ButtonGroup`
// orientation story filled.
export const Disabled: Story = {
  render: () => ({
    components,
    template: `
      <FieldsetRoot disabled class="w-96">
        <FieldsetLegend>Profile Settings</FieldsetLegend>
        <Description>Editing is turned off while your account is under review.</Description>
        <FieldGroup>
          <TextField name="name">
            <Label>Name</Label>
            <Input placeholder="John Doe" />
          </TextField>
          <TextField name="bio">
            <Label>Bio</Label>
            <TextArea placeholder="Tell us about yourself..." />
          </TextField>
        </FieldGroup>
        <FieldsetActions>
          <Button type="submit">
            <IconFloppyDisk />
            Save changes
          </Button>
          <Button type="reset" variant="tertiary">Cancel</Button>
        </FieldsetActions>
      </FieldsetRoot>
    `,
  }),
};
