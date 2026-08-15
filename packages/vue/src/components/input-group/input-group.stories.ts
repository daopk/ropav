import type {StoryMeta} from "../../utils/story-meta";
import type {StoryObj} from "@storybook/vue3";

import {shallowRef} from "vue";

import {Button} from "../button";
import {Chip, ChipLabel} from "../chip";
import {Description} from "../description";
import {FieldError} from "../field-error";
import {Kbd, KbdAbbr, KbdContent} from "../kbd";
import {Label} from "../label";
import {Spinner} from "../spinner";
import {TextField} from "../textfield";
import {TooltipContent, TooltipRoot} from "../tooltip";

import {
  InputGroup,
  InputGroupInput,
  InputGroupPrefix,
  InputGroupRoot,
  InputGroupSuffix,
  InputGroupTextArea,
} from "./index";

import IconArrowUp from "~icons/gravity-ui/arrow-up";
import IconAt from "~icons/gravity-ui/at";
import IconCopy from "~icons/gravity-ui/copy";
import IconEnvelope from "~icons/gravity-ui/envelope";
import IconEye from "~icons/gravity-ui/eye";
import IconEyeSlash from "~icons/gravity-ui/eye-slash";
import IconGlobe from "~icons/gravity-ui/globe";
import IconMicrophone from "~icons/gravity-ui/microphone";
import IconPlugConnection from "~icons/gravity-ui/plug-connection";
import IconPlus from "~icons/gravity-ui/plus";

// Registered part by part: a story template is compiled at runtime, with no binding metadata
// to resolve `InputGroup.Prefix` through, so dot notation cannot be used here.
const components = {
  Button,
  Chip,
  ChipLabel,
  Description,
  FieldError,
  IconArrowUp,
  IconAt,
  IconCopy,
  IconEnvelope,
  IconEye,
  IconEyeSlash,
  IconGlobe,
  IconMicrophone,
  IconPlugConnection,
  IconPlus,
  InputGroupInput,
  InputGroupPrefix,
  InputGroupRoot,
  InputGroupSuffix,
  InputGroupTextArea,
  Kbd,
  KbdAbbr,
  KbdContent,
  Label,
  Spinner,
  TextField,
  Tooltip: TooltipRoot,
  TooltipContent,
};

const meta: StoryMeta = {
  component: InputGroup,
  parameters: {
    layout: "centered",
  },
  title: "Components/Forms/InputGroup",
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    components,
    template: `
      <TextField class="w-[280px]" name="email">
        <Label>Email address</Label>
        <InputGroupRoot>
          <InputGroupPrefix>
            <IconEnvelope class="size-4 text-muted" />
          </InputGroupPrefix>
          <InputGroupInput class="w-[280px]" placeholder="name@email.com" />
        </InputGroupRoot>
      </TextField>
    `,
  }),
};

export const Variants: Story = {
  render: () => ({
    components,
    template: `
      <div class="flex flex-col gap-4">
        <TextField class="w-[280px]" name="primary">
          <Label>Primary variant</Label>
          <InputGroupRoot variant="primary">
            <InputGroupPrefix>
              <IconEnvelope class="size-4 text-muted" />
            </InputGroupPrefix>
            <InputGroupInput placeholder="name@email.com" />
          </InputGroupRoot>
        </TextField>
        <TextField class="w-[280px]" name="secondary">
          <Label>Secondary variant</Label>
          <InputGroupRoot variant="secondary">
            <InputGroupPrefix>
              <IconEnvelope class="size-4 text-muted" />
            </InputGroupPrefix>
            <InputGroupInput placeholder="name@email.com" />
          </InputGroupRoot>
        </TextField>
      </div>
    `,
  }),
};

export const FullWidth: Story = {
  render: () => ({
    components,
    template: `
      <div class="w-[400px] space-y-4">
        <TextField full-width name="email">
          <Label>Email address</Label>
          <InputGroupRoot full-width>
            <InputGroupPrefix>
              <IconEnvelope class="size-4 text-muted" />
            </InputGroupPrefix>
            <InputGroupInput placeholder="name@email.com" />
          </InputGroupRoot>
        </TextField>
        <TextField full-width name="password">
          <Label>Password</Label>
          <InputGroupRoot full-width>
            <InputGroupInput placeholder="Enter password" type="password" />
            <InputGroupSuffix>
              <IconEye class="size-4 text-muted" />
            </InputGroupSuffix>
          </InputGroupRoot>
        </TextField>
      </div>
    `,
  }),
};

export const WithPrefixIcon: Story = {
  render: () => ({
    components,
    template: `
      <TextField class="w-[280px]" name="email">
        <Label>Email address</Label>
        <InputGroupRoot>
          <InputGroupPrefix>
            <IconEnvelope class="size-4 text-muted" />
          </InputGroupPrefix>
          <InputGroupInput class="w-[280px]" placeholder="name@email.com" />
        </InputGroupRoot>
        <Description>We'll never share this with anyone else</Description>
      </TextField>
    `,
  }),
};

export const WithSuffixIcon: Story = {
  render: () => ({
    components,
    template: `
      <TextField class="w-[280px]" name="email">
        <Label>Email address</Label>
        <InputGroupRoot>
          <InputGroupInput class="w-[280px]" placeholder="name@email.com" />
          <InputGroupSuffix>
            <IconEnvelope class="size-4 text-muted" />
          </InputGroupSuffix>
        </InputGroupRoot>
        <Description>We don't send spam</Description>
      </TextField>
    `,
  }),
};

export const WithPrefixAndSuffix: Story = {
  render: () => ({
    components,
    template: `
      <TextField class="w-[280px]" default-value="10" name="price">
        <Label>Set a price</Label>
        <InputGroupRoot>
          <InputGroupPrefix>$</InputGroupPrefix>
          <InputGroupInput class="w-[200px]" type="number" />
          <InputGroupSuffix>USD</InputGroupSuffix>
        </InputGroupRoot>
        <Description>What customers would pay</Description>
      </TextField>
    `,
  }),
};

export const WithTextPrefix: Story = {
  render: () => ({
    components,
    template: `
      <TextField class="w-[280px]" default-value="heroui.com" name="website">
        <Label>Website</Label>
        <InputGroupRoot>
          <InputGroupPrefix>https://</InputGroupPrefix>
          <InputGroupInput class="w-[280px]" />
        </InputGroupRoot>
      </TextField>
    `,
  }),
};

export const WithTextSuffix: Story = {
  render: () => ({
    components,
    template: `
      <TextField class="w-[280px]" default-value="heroui" name="website">
        <Label>Website</Label>
        <InputGroupRoot>
          <InputGroupInput class="w-[280px]" />
          <InputGroupSuffix>.com</InputGroupSuffix>
        </InputGroupRoot>
      </TextField>
    `,
  }),
};

export const WithIconPrefixAndTextSuffix: Story = {
  render: () => ({
    components,
    template: `
      <TextField class="w-[280px]" default-value="heroui" name="website">
        <Label>Website</Label>
        <InputGroupRoot>
          <InputGroupPrefix>
            <IconGlobe class="size-4 text-muted" />
          </InputGroupPrefix>
          <InputGroupInput class="w-[280px]" />
          <InputGroupSuffix>.com</InputGroupSuffix>
        </InputGroupRoot>
      </TextField>
    `,
  }),
};

export const WithCopySuffix: Story = {
  render: () => ({
    components,
    template: `
      <TextField class="w-[280px]" default-value="heroui.com" name="website">
        <Label>Website</Label>
        <InputGroupRoot>
          <InputGroupInput class="w-[280px]" />
          <InputGroupSuffix class="pe-0">
            <Button is-icon-only aria-label="Copy" size="sm" variant="ghost">
              <IconCopy class="size-4" />
            </Button>
          </InputGroupSuffix>
        </InputGroupRoot>
      </TextField>
    `,
  }),
};

export const WithIconPrefixAndCopySuffix: Story = {
  render: () => ({
    components,
    template: `
      <TextField class="w-[280px]" default-value="heroui.com" name="website">
        <Label>Website</Label>
        <InputGroupRoot>
          <InputGroupPrefix>
            <IconGlobe class="size-4 text-muted" />
          </InputGroupPrefix>
          <InputGroupInput class="w-[280px]" />
          <InputGroupSuffix class="pe-0">
            <Button is-icon-only aria-label="Copy" size="sm" variant="ghost">
              <IconCopy class="size-4" />
            </Button>
          </InputGroupSuffix>
        </InputGroupRoot>
      </TextField>
    `,
  }),
};

export const PasswordWithToggle: Story = {
  render: () => ({
    components,
    setup: () => {
      const isVisible = shallowRef(false);

      return {isVisible};
    },
    template: `
      <TextField class="w-[280px]" name="password">
        <Label>Password</Label>
        <InputGroupRoot>
          <InputGroupInput
            class="w-[280px]"
            :type="isVisible ? 'text' : 'password'"
            :value="isVisible ? '87$2h.3diua' : '••••••••'"
          />
          <InputGroupSuffix class="pe-0">
            <Button
              is-icon-only
              :aria-label="isVisible ? 'Hide password' : 'Show password'"
              size="sm"
              variant="ghost"
              @click="isVisible = !isVisible"
            >
              <IconEye v-if="isVisible" class="size-4" />
              <IconEyeSlash v-else class="size-4" />
            </Button>
          </InputGroupSuffix>
        </InputGroupRoot>
      </TextField>
    `,
  }),
};

export const WithLoadingSuffix: Story = {
  render: () => ({
    components,
    template: `
      <TextField class="w-[280px]" default-value="Sending..." name="status">
        <InputGroupRoot>
          <InputGroupInput class="w-[280px]" />
          <InputGroupSuffix>
            <Spinner class="size-4" />
          </InputGroupSuffix>
        </InputGroupRoot>
      </TextField>
    `,
  }),
};

export const WithKeyboardShortcut: Story = {
  render: () => ({
    components,
    template: `
      <TextField aria-label="Command" class="w-[280px]" name="command">
        <InputGroupRoot>
          <InputGroupInput class="w-[280px]" placeholder="Command" />
          <InputGroupSuffix class="pe-2">
            <Kbd>
              <KbdAbbr key-value="command" />
              <KbdContent>K</KbdContent>
            </Kbd>
          </InputGroupSuffix>
        </InputGroupRoot>
      </TextField>
    `,
  }),
};

export const WithBadgeSuffix: Story = {
  render: () => ({
    components,
    template: `
      <TextField aria-label="Email address" class="w-[280px]" name="email">
        <InputGroupRoot>
          <InputGroupInput class="w-[280px]" placeholder="Email address" />
          <InputGroupSuffix class="pe-2">
            <Chip color="accent" size="md" variant="soft"><ChipLabel>Pro</ChipLabel></Chip>
          </InputGroupSuffix>
        </InputGroupRoot>
      </TextField>
    `,
  }),
};

export const Required: Story = {
  render: () => ({
    components,
    template: `
      <div class="flex flex-col gap-4">
        <TextField is-required class="w-[280px]" name="email">
          <Label>Email address</Label>
          <InputGroupRoot>
            <InputGroupPrefix>
              <IconEnvelope class="size-4 text-muted" />
            </InputGroupPrefix>
            <InputGroupInput class="w-[280px]" placeholder="name@email.com" />
          </InputGroupRoot>
        </TextField>
        <TextField is-required name="price">
          <Label>Set a price</Label>
          <InputGroupRoot>
            <InputGroupPrefix>$</InputGroupPrefix>
            <InputGroupInput class="w-[200px]" placeholder="0" type="number" />
            <InputGroupSuffix>USD</InputGroupSuffix>
          </InputGroupRoot>
          <Description>What customers would pay</Description>
        </TextField>
      </div>
    `,
  }),
};

export const Invalid: Story = {
  render: () => ({
    components,
    template: `
      <div class="flex flex-col gap-4">
        <TextField is-invalid is-required class="w-[280px]" name="email">
          <Label>Email address</Label>
          <InputGroupRoot>
            <InputGroupPrefix>
              <IconEnvelope class="size-4 text-muted" />
            </InputGroupPrefix>
            <InputGroupInput class="w-[280px]" placeholder="name@email.com" />
          </InputGroupRoot>
          <FieldError>Please enter a valid email address</FieldError>
        </TextField>
        <TextField is-invalid is-required class="w-[280px]" name="price">
          <Label>Set a price</Label>
          <InputGroupRoot>
            <InputGroupPrefix>$</InputGroupPrefix>
            <InputGroupInput class="w-[200px]" placeholder="0" type="number" />
            <InputGroupSuffix>USD</InputGroupSuffix>
          </InputGroupRoot>
          <FieldError>Price must be greater than 0</FieldError>
        </TextField>
      </div>
    `,
  }),
};

export const Disabled: Story = {
  render: () => ({
    components,
    template: `
      <div class="flex flex-col gap-4">
        <TextField is-disabled class="w-[280px]" default-value="name@email.com" name="email">
          <Label>Email address</Label>
          <InputGroupRoot>
            <InputGroupPrefix>
              <IconEnvelope class="size-4 text-muted" />
            </InputGroupPrefix>
            <InputGroupInput class="w-[280px]" />
          </InputGroupRoot>
        </TextField>
        <TextField is-disabled class="w-[280px]" default-value="10" name="price">
          <Label>Set a price</Label>
          <InputGroupRoot>
            <InputGroupPrefix>$</InputGroupPrefix>
            <InputGroupInput class="w-[200px]" type="number" />
            <InputGroupSuffix>USD</InputGroupSuffix>
          </InputGroupRoot>
        </TextField>
      </div>
    `,
  }),
};

export const WithTextArea: Story = {
  render: () => ({
    components,
    setup: () => {
      const value = shallowRef("");
      const isSubmitting = shallowRef(false);

      const onSubmit = () => {
        if (!value.value.trim()) return;

        isSubmitting.value = true;

        setTimeout(() => {
          isSubmitting.value = false;
          value.value = "";
        }, 1000);
      };

      return {isSubmitting, onSubmit, value};
    },
    template: `
      <TextField full-width aria-label="Prompt input" class="flex w-sm flex-col sm:w-lg" name="prompt">
        <InputGroupRoot full-width class="flex flex-col gap-2 rounded-3xl py-2">
          <InputGroupPrefix class="px-3 py-0">
            <Button aria-label="Add context" size="sm" variant="outline">
              <IconAt />
              Add Context
            </Button>
          </InputGroupPrefix>
          <InputGroupTextArea
            v-model:value="value"
            class="w-full resize-none px-3.5 py-0"
            placeholder="Assign tasks or ask anything..."
            :rows="5"
          />
          <InputGroupSuffix class="flex w-full items-center gap-1.5 px-3 py-0">
            <Tooltip :delay="0">
              <Button is-icon-only aria-label="Attach file" size="sm" variant="tertiary">
                <IconPlus />
              </Button>
              <TooltipContent>
                <p class="text-xs">Add a files and more</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip :delay="0">
              <Button is-icon-only aria-label="Connect Apps" size="sm" variant="tertiary">
                <IconPlugConnection />
              </Button>
              <TooltipContent>
                <p class="text-xs">Connect apps</p>
              </TooltipContent>
            </Tooltip>
            <div class="ms-auto flex items-center gap-1.5">
              <Tooltip :delay="0">
                <Button is-icon-only aria-label="Voice input" size="sm" variant="ghost">
                  <IconMicrophone />
                </Button>
                <TooltipContent>
                  <p class="text-xs">Voice input</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip :delay="0">
                <Button
                  v-slot="{isPending}"
                  is-icon-only
                  aria-label="Send prompt"
                  :is-disabled="!value.trim()"
                  :is-pending="isSubmitting"
                  @click="onSubmit"
                >
                  <Spinner v-if="isPending" color="current" size="sm" />
                  <IconArrowUp v-else />
                </Button>
                <TooltipContent class="flex items-center gap-1">
                  <p class="text-xs">Send</p>
                  <Kbd class="h-4 rounded-sm px-1">
                    <KbdAbbr key-value="enter" />
                  </Kbd>
                </TooltipContent>
              </Tooltip>
            </div>
          </InputGroupSuffix>
        </InputGroupRoot>
      </TextField>
    `,
  }),
};

export const AllVariations: Story = {
  render: () => ({
    components,
    template: `
      <div class="flex flex-col gap-6">
        <div class="flex flex-col gap-4">
          <TextField class="w-[280px]" name="email1">
            <Label>Email address *</Label>
            <InputGroupRoot>
              <InputGroupPrefix>
                <IconEnvelope class="size-4 text-muted" />
              </InputGroupPrefix>
              <InputGroupInput class="w-[280px]" placeholder="name@email.com" />
            </InputGroupRoot>
            <Description>We'll never share this with anyone else</Description>
          </TextField>

          <TextField class="w-[280px]" name="email2">
            <Label>Email address *</Label>
            <InputGroupRoot>
              <InputGroupInput class="w-[280px]" placeholder="name@email.com" />
              <InputGroupSuffix>
                <IconEnvelope class="size-4 text-muted" />
              </InputGroupSuffix>
            </InputGroupRoot>
            <Description>We don't send spam</Description>
          </TextField>

          <TextField class="w-[280px]" default-value="10" name="price">
            <Label>Set a price</Label>
            <InputGroupRoot>
              <InputGroupPrefix>$</InputGroupPrefix>
              <InputGroupInput class="w-[200px]" type="number" />
              <InputGroupSuffix>USD</InputGroupSuffix>
            </InputGroupRoot>
            <Description>What customers would pay</Description>
          </TextField>

          <TextField class="w-[280px]" default-value="heroui.com" name="website1">
            <Label>Website</Label>
            <InputGroupRoot>
              <InputGroupPrefix>https://</InputGroupPrefix>
              <InputGroupInput class="w-[280px]" />
            </InputGroupRoot>
          </TextField>

          <TextField class="w-[280px]" default-value="heroui" name="website2">
            <Label>Website</Label>
            <InputGroupRoot>
              <InputGroupInput class="w-[280px]" />
              <InputGroupSuffix>.com</InputGroupSuffix>
            </InputGroupRoot>
          </TextField>

          <TextField class="w-[280px]" default-value="heroui" name="website3">
            <Label>Website</Label>
            <InputGroupRoot>
              <InputGroupPrefix>
                <IconGlobe class="size-4 text-muted" />
              </InputGroupPrefix>
              <InputGroupInput class="w-[280px]" />
              <InputGroupSuffix>.com</InputGroupSuffix>
            </InputGroupRoot>
          </TextField>

          <TextField class="w-[280px]" default-value="heroui.com" name="website4">
            <Label>Website</Label>
            <InputGroupRoot>
              <InputGroupInput class="w-[280px]" />
              <InputGroupSuffix class="pe-0">
                <Button is-icon-only aria-label="Copy" class="h-auto p-0" size="sm" variant="ghost">
                  <IconCopy class="size-4" />
                </Button>
              </InputGroupSuffix>
            </InputGroupRoot>
          </TextField>

          <TextField class="w-[280px]" default-value="heroui.com" name="website5">
            <Label>Website</Label>
            <InputGroupRoot>
              <InputGroupPrefix>
                <IconGlobe class="size-4 text-muted" />
              </InputGroupPrefix>
              <InputGroupInput class="w-[280px]" />
              <InputGroupSuffix class="pe-0">
                <Button is-icon-only aria-label="Copy" class="h-auto p-0" size="sm" variant="ghost">
                  <IconCopy class="size-4" />
                </Button>
              </InputGroupSuffix>
            </InputGroupRoot>
          </TextField>
        </div>
      </div>
    `,
  }),
};
