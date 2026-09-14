import type { StoryMeta } from "../../utils/story-meta";
import type { StoryObj } from "@storybook/vue3-vite";

import { shallowRef } from "vue";
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

import { Button } from "../button";
import { Card, CardContent } from "../card";
import { Chip, ChipLabel } from "../chip";
import { Description } from "../description";
import { FieldError } from "../field-error";
import { Kbd, KbdAbbr, KbdContent } from "../kbd";
import { Label } from "../label";
import { Popover, PopoverContent, PopoverDialog } from "../popover";
import { Spinner } from "../spinner";
import { TextField } from "../textfield";
import { TooltipContent, Tooltip } from "../tooltip";

import {
  InputGroup,
  InputGroupInput,
  InputGroupPrefix,
  InputGroupSuffix,
  InputGroupTextArea,
} from "./index";

// Registered part by part: a story template is compiled at runtime, with no binding metadata
// to resolve `InputGroupPrefix` through, so dot notation cannot be used here.
const components = {
  Button,
  Card,
  CardContent,
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
  InputGroup,
  InputGroupInput,
  InputGroupPrefix,
  InputGroupSuffix,
  InputGroupTextArea,
  Kbd,
  KbdAbbr,
  KbdContent,
  Label,
  Popover,
  PopoverContent,
  PopoverDialog,
  Spinner,
  TextField,
  Tooltip: Tooltip,
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
        <InputGroup>
          <InputGroupPrefix>
            <IconEnvelope class="size-4 text-[var(--rp-muted)]" />
          </InputGroupPrefix>
          <InputGroupInput class="w-[280px]" placeholder="name@email.com" />
        </InputGroup>
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
          <InputGroup variant="primary">
            <InputGroupPrefix>
              <IconEnvelope class="size-4 text-[var(--rp-muted)]" />
            </InputGroupPrefix>
            <InputGroupInput placeholder="name@email.com" />
          </InputGroup>
        </TextField>
        <TextField class="w-[280px]" name="secondary">
          <Label>Secondary variant</Label>
          <InputGroup variant="secondary">
            <InputGroupPrefix>
              <IconEnvelope class="size-4 text-[var(--rp-muted)]" />
            </InputGroupPrefix>
            <InputGroupInput placeholder="name@email.com" />
          </InputGroup>
        </TextField>
      </div>
    `,
  }),
};

/**
 * The size is set once on the field and the group inside follows, the way the variant does.
 *
 * Setting it on the group itself works too, and wins - which is what a group standing outside any
 * field has to do.
 */
export const Sizes: Story = {
  render: () => ({
    components,
    setup: () => ({ sizes: ["sm", "md", "lg"] as const }),
    template: `
      <div class="flex flex-col gap-4">
        <TextField v-for="size in sizes" :key="size" class="w-[280px]" name="email" :size="size">
          <Label>Size {{ size }}</Label>
          <InputGroup>
            <InputGroupPrefix>
              <IconEnvelope class="size-4 text-[var(--rp-muted)]" />
            </InputGroupPrefix>
            <InputGroupInput placeholder="name@email.com" />
          </InputGroup>
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
          <InputGroup full-width>
            <InputGroupPrefix>
              <IconEnvelope class="size-4 text-[var(--rp-muted)]" />
            </InputGroupPrefix>
            <InputGroupInput placeholder="name@email.com" />
          </InputGroup>
        </TextField>
        <TextField full-width name="password">
          <Label>Password</Label>
          <InputGroup full-width>
            <InputGroupInput placeholder="Enter password" type="password" />
            <InputGroupSuffix>
              <IconEye class="size-4 text-[var(--rp-muted)]" />
            </InputGroupSuffix>
          </InputGroup>
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
        <InputGroup>
          <InputGroupPrefix>
            <IconEnvelope class="size-4 text-[var(--rp-muted)]" />
          </InputGroupPrefix>
          <InputGroupInput class="w-[280px]" placeholder="name@email.com" />
        </InputGroup>
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
        <InputGroup>
          <InputGroupInput class="w-[280px]" placeholder="name@email.com" />
          <InputGroupSuffix>
            <IconEnvelope class="size-4 text-[var(--rp-muted)]" />
          </InputGroupSuffix>
        </InputGroup>
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
        <InputGroup>
          <InputGroupPrefix>$</InputGroupPrefix>
          <InputGroupInput class="w-[200px]" type="number" />
          <InputGroupSuffix>USD</InputGroupSuffix>
        </InputGroup>
        <Description>What customers would pay</Description>
      </TextField>
    `,
  }),
};

export const WithTextPrefix: Story = {
  render: () => ({
    components,
    template: `
      <TextField class="w-[280px]" default-value="ropav.com" name="website">
        <Label>Website</Label>
        <InputGroup>
          <InputGroupPrefix>https://</InputGroupPrefix>
          <InputGroupInput class="w-[280px]" />
        </InputGroup>
      </TextField>
    `,
  }),
};

export const WithTextSuffix: Story = {
  render: () => ({
    components,
    template: `
      <TextField class="w-[280px]" default-value="ropav" name="website">
        <Label>Website</Label>
        <InputGroup>
          <InputGroupInput class="w-[280px]" />
          <InputGroupSuffix>.com</InputGroupSuffix>
        </InputGroup>
      </TextField>
    `,
  }),
};

export const WithIconPrefixAndTextSuffix: Story = {
  render: () => ({
    components,
    template: `
      <TextField class="w-[280px]" default-value="ropav" name="website">
        <Label>Website</Label>
        <InputGroup>
          <InputGroupPrefix>
            <IconGlobe class="size-4 text-[var(--rp-muted)]" />
          </InputGroupPrefix>
          <InputGroupInput class="w-[280px]" />
          <InputGroupSuffix>.com</InputGroupSuffix>
        </InputGroup>
      </TextField>
    `,
  }),
};

export const WithCopySuffix: Story = {
  render: () => ({
    components,
    template: `
      <TextField class="w-[280px]" default-value="ropav.com" name="website">
        <Label>Website</Label>
        <InputGroup>
          <InputGroupInput class="w-[280px]" />
          <InputGroupSuffix class="pe-0">
            <Button is-icon-only aria-label="Copy" size="sm" variant="ghost">
              <IconCopy class="size-4" />
            </Button>
          </InputGroupSuffix>
        </InputGroup>
      </TextField>
    `,
  }),
};

export const WithIconPrefixAndCopySuffix: Story = {
  render: () => ({
    components,
    template: `
      <TextField class="w-[280px]" default-value="ropav.com" name="website">
        <Label>Website</Label>
        <InputGroup>
          <InputGroupPrefix>
            <IconGlobe class="size-4 text-[var(--rp-muted)]" />
          </InputGroupPrefix>
          <InputGroupInput class="w-[280px]" />
          <InputGroupSuffix class="pe-0">
            <Button is-icon-only aria-label="Copy" size="sm" variant="ghost">
              <IconCopy class="size-4" />
            </Button>
          </InputGroupSuffix>
        </InputGroup>
      </TextField>
    `,
  }),
};

export const PasswordWithToggle: Story = {
  render: () => ({
    components,
    setup: () => {
      const isVisible = shallowRef(false);

      return { isVisible };
    },
    template: `
      <TextField class="w-[280px]" name="password">
        <Label>Password</Label>
        <InputGroup>
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
        </InputGroup>
      </TextField>
    `,
  }),
};

export const WithLoadingSuffix: Story = {
  render: () => ({
    components,
    template: `
      <TextField aria-label="Status" class="w-[280px]" default-value="Sending..." name="status">
        <InputGroup>
          <InputGroupInput class="w-[280px]" />
          <InputGroupSuffix>
            <Spinner class="size-4" />
          </InputGroupSuffix>
        </InputGroup>
      </TextField>
    `,
  }),
};

export const WithKeyboardShortcut: Story = {
  render: () => ({
    components,
    template: `
      <TextField aria-label="Command" class="w-[280px]" name="command">
        <InputGroup>
          <InputGroupInput class="w-[280px]" placeholder="Command" />
          <InputGroupSuffix class="pe-2">
            <Kbd>
              <KbdAbbr key-value="command" />
              <KbdContent>K</KbdContent>
            </Kbd>
          </InputGroupSuffix>
        </InputGroup>
      </TextField>
    `,
  }),
};

export const WithBadgeSuffix: Story = {
  render: () => ({
    components,
    template: `
      <TextField aria-label="Email address" class="w-[280px]" name="email">
        <InputGroup>
          <InputGroupInput class="w-[280px]" placeholder="Email address" />
          <InputGroupSuffix class="pe-2">
            <Chip color="accent" size="md" variant="soft"><ChipLabel>Pro</ChipLabel></Chip>
          </InputGroupSuffix>
        </InputGroup>
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
          <InputGroup>
            <InputGroupPrefix>
              <IconEnvelope class="size-4 text-[var(--rp-muted)]" />
            </InputGroupPrefix>
            <InputGroupInput class="w-[280px]" placeholder="name@email.com" />
          </InputGroup>
        </TextField>
        <TextField is-required name="price">
          <Label>Set a price</Label>
          <InputGroup>
            <InputGroupPrefix>$</InputGroupPrefix>
            <InputGroupInput class="w-[200px]" placeholder="0" type="number" />
            <InputGroupSuffix>USD</InputGroupSuffix>
          </InputGroup>
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
          <InputGroup>
            <InputGroupPrefix>
              <IconEnvelope class="size-4 text-[var(--rp-muted)]" />
            </InputGroupPrefix>
            <InputGroupInput class="w-[280px]" placeholder="name@email.com" />
          </InputGroup>
          <FieldError>Please enter a valid email address</FieldError>
        </TextField>
        <TextField is-invalid is-required class="w-[280px]" name="price">
          <Label>Set a price</Label>
          <InputGroup>
            <InputGroupPrefix>$</InputGroupPrefix>
            <InputGroupInput class="w-[200px]" placeholder="0" type="number" />
            <InputGroupSuffix>USD</InputGroupSuffix>
          </InputGroup>
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
          <InputGroup>
            <InputGroupPrefix>
              <IconEnvelope class="size-4 text-[var(--rp-muted)]" />
            </InputGroupPrefix>
            <InputGroupInput class="w-[280px]" />
          </InputGroup>
        </TextField>
        <TextField is-disabled class="w-[280px]" default-value="10" name="price">
          <Label>Set a price</Label>
          <InputGroup>
            <InputGroupPrefix>$</InputGroupPrefix>
            <InputGroupInput class="w-[200px]" type="number" />
            <InputGroupSuffix>USD</InputGroupSuffix>
          </InputGroup>
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

      return { isSubmitting, onSubmit, value };
    },
    template: `
      <TextField full-width aria-label="Prompt input" class="flex w-sm flex-col sm:w-lg" name="prompt">
        <InputGroup full-width class="flex flex-col gap-2 rounded-[calc(var(--rp-radius)*3)] py-2">
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
                  <Kbd class="h-4 rounded-[calc(var(--rp-radius)*0.5)] px-1">
                    <KbdAbbr key-value="enter" />
                  </Kbd>
                </TooltipContent>
              </Tooltip>
            </div>
          </InputGroupSuffix>
        </InputGroup>
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
            <InputGroup>
              <InputGroupPrefix>
                <IconEnvelope class="size-4 text-[var(--rp-muted)]" />
              </InputGroupPrefix>
              <InputGroupInput class="w-[280px]" placeholder="name@email.com" />
            </InputGroup>
            <Description>We'll never share this with anyone else</Description>
          </TextField>

          <TextField class="w-[280px]" name="email2">
            <Label>Email address *</Label>
            <InputGroup>
              <InputGroupInput class="w-[280px]" placeholder="name@email.com" />
              <InputGroupSuffix>
                <IconEnvelope class="size-4 text-[var(--rp-muted)]" />
              </InputGroupSuffix>
            </InputGroup>
            <Description>We don't send spam</Description>
          </TextField>

          <TextField class="w-[280px]" default-value="10" name="price">
            <Label>Set a price</Label>
            <InputGroup>
              <InputGroupPrefix>$</InputGroupPrefix>
              <InputGroupInput class="w-[200px]" type="number" />
              <InputGroupSuffix>USD</InputGroupSuffix>
            </InputGroup>
            <Description>What customers would pay</Description>
          </TextField>

          <TextField class="w-[280px]" default-value="ropav.com" name="website1">
            <Label>Website</Label>
            <InputGroup>
              <InputGroupPrefix>https://</InputGroupPrefix>
              <InputGroupInput class="w-[280px]" />
            </InputGroup>
          </TextField>

          <TextField class="w-[280px]" default-value="ropav" name="website2">
            <Label>Website</Label>
            <InputGroup>
              <InputGroupInput class="w-[280px]" />
              <InputGroupSuffix>.com</InputGroupSuffix>
            </InputGroup>
          </TextField>

          <TextField class="w-[280px]" default-value="ropav" name="website3">
            <Label>Website</Label>
            <InputGroup>
              <InputGroupPrefix>
                <IconGlobe class="size-4 text-[var(--rp-muted)]" />
              </InputGroupPrefix>
              <InputGroupInput class="w-[280px]" />
              <InputGroupSuffix>.com</InputGroupSuffix>
            </InputGroup>
          </TextField>

          <TextField class="w-[280px]" default-value="ropav.com" name="website4">
            <Label>Website</Label>
            <InputGroup>
              <InputGroupInput class="w-[280px]" />
              <InputGroupSuffix class="pe-0">
                <Button is-icon-only aria-label="Copy" class="h-auto p-0" size="sm" variant="ghost">
                  <IconCopy class="size-4" />
                </Button>
              </InputGroupSuffix>
            </InputGroup>
          </TextField>

          <TextField class="w-[280px]" default-value="ropav.com" name="website5">
            <Label>Website</Label>
            <InputGroup>
              <InputGroupPrefix>
                <IconGlobe class="size-4 text-[var(--rp-muted)]" />
              </InputGroupPrefix>
              <InputGroupInput class="w-[280px]" />
              <InputGroupSuffix class="pe-0">
                <Button is-icon-only aria-label="Copy" class="h-auto p-0" size="sm" variant="ghost">
                  <IconCopy class="size-4" />
                </Button>
              </InputGroupSuffix>
            </InputGroup>
          </TextField>
        </div>
      </div>
    `,
  }),
};

/**
 * The same field over every fill the library paints behind it.
 *
 * A field takes `--rp-field-background` from `--rp-surface`, and `--secondary` takes `--rp-default`,
 * so either variant can end up the same colour as whatever it is sitting on — a primary field on a
 * default card or inside a popover, a secondary one on a tertiary card. What separates it there is
 * `--rp-field-edge`, an inset hairline that owes nothing to the container; the drop shadow is gone
 * in the dark half and the secondary variant drops it in both, so nothing else is left to.
 *
 * Worth reading in both schemes and on more than one palette — the toolbar drives both, and the
 * URL takes them as `?globals=ropav-scheme:dark` and `ropav-theme:<id>`.
 */
export const AcrossSurfaces: Story = {
  parameters: { layout: "fullscreen" },
  render: () => ({
    components,
    setup: () => ({ variants: ["primary", "secondary"] as const }),
    template: `
      <div class="flex flex-col gap-6 p-6">
        <div class="flex flex-col gap-3">
          <span class="text-xs text-[var(--rp-muted)]">On the page</span>
          <div class="flex gap-3">
            <InputGroup v-for="variant in variants" :key="variant" :variant="variant">
              <InputGroupPrefix>
                <IconEnvelope class="size-4 text-[var(--rp-muted)]" />
              </InputGroupPrefix>
              <InputGroupInput class="w-[200px]" :placeholder="variant" />
            </InputGroup>
          </div>
        </div>

        <Card v-for="card in ['default', 'secondary', 'tertiary']" :key="card" :variant="card">
          <CardContent class="flex flex-col gap-3">
            <span class="text-xs text-[var(--rp-muted)]">On a {{ card }} card</span>
            <div class="flex gap-3">
              <InputGroup v-for="variant in variants" :key="variant" :variant="variant">
                <InputGroupPrefix>
                  <IconEnvelope class="size-4 text-[var(--rp-muted)]" />
                </InputGroupPrefix>
                <InputGroupInput class="w-[200px]" :placeholder="variant" />
              </InputGroup>
            </div>
          </CardContent>
        </Card>

        <Popover default-open>
          <Button variant="tertiary">In a popover</Button>
          <PopoverContent is-non-modal placement="bottom start">
            <PopoverDialog class="flex flex-col gap-3">
              <span class="text-xs text-[var(--rp-muted)]">In a popover</span>
              <div class="flex gap-3">
                <InputGroup v-for="variant in variants" :key="variant" :variant="variant">
                  <InputGroupPrefix>
                    <IconEnvelope class="size-4 text-[var(--rp-muted)]" />
                  </InputGroupPrefix>
                  <InputGroupInput class="w-[200px]" :placeholder="variant" />
                </InputGroup>
              </div>
            </PopoverDialog>
          </PopoverContent>
        </Popover>
      </div>
    `,
  }),
};
