import type { StoryMeta } from "../../utils/story-meta";
import type { StoryObj } from "@storybook/vue3-vite";

import { computed, shallowRef } from "vue";
import IconBox from "~icons/gravity-ui/box";
import IconChevronDown from "~icons/gravity-ui/chevron-down";
import IconChevronUp from "~icons/gravity-ui/chevron-up";
import IconQrCode from "~icons/gravity-ui/qr-code";
import IconApple from "~icons/tabler/brand-apple-filled";

import { qrCodeSrc } from "../../utils/story-assets";
import { Button } from "../button";
import { Chip } from "../chip";

import {
  Disclosure,
  DisclosureBody,
  DisclosureContent,
  DisclosureHeading,
  DisclosureIndicator,
  DisclosureTrigger,
} from "./index";

/**
 * Story templates are compiled at runtime, where Vue resolves a tag like `Disclosure.Trigger`
 * as a component literally named "Disclosure.Trigger" and fails. Dot notation only works in an
 * SFC, whose compiler resolves it against the setup scope. So the parts are registered
 * individually here — in application code `<Disclosure.Trigger>` inside an SFC is fine.
 */
const components = {
  Button,
  Chip,
  Disclosure,
  DisclosureBody,
  DisclosureContent,
  DisclosureHeading,
  DisclosureIndicator,
  DisclosureTrigger,
  IconApple,
  IconBox,
  IconChevronDown,
  IconChevronUp,
  IconQrCode,
};

const QR_CODE_SRC = qrCodeSrc("https://github.com/daopk/ropav");

const meta: StoryMeta = {
  argTypes: {
    isDisabled: { control: { type: "boolean" } },
    isExpanded: { control: { type: "boolean" } },
  },
  args: {
    isDisabled: false,
    isExpanded: false,
  },
  component: Disclosure,
  parameters: {
    layout: "centered",
  },
  title: "Components/Navigation/Disclosure",
};

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * The trigger is an ordinary `Button`, with no `Disclosure.Trigger` wrapper: the disclosure
 * hands the press and the ARIA wiring down to whatever pressable sits inside it.
 */
const template = `
  <div class="w-full max-w-md text-center">
    <Disclosure :is-disabled="args.isDisabled" :is-expanded="isExpanded" @expanded-change="isExpanded = $event">
      <DisclosureHeading>
        <Button variant="secondary">
          <IconQrCode />
          Preview Ropav Native
          <DisclosureIndicator />
        </Button>
      </DisclosureHeading>
      <DisclosureContent>
        <DisclosureBody class="flex flex-col items-center rounded-3xl bg-surface p-2 p-4 text-center shadow-surface">
          <p class="text-sm text-muted">
            Scan this QR code with your camera app to preview the Ropav native components.
          </p>
          <img
            alt="Expo Go QR Code"
            class="aspect-square w-full max-w-54 object-cover"
            :src="qrCodeSrc"
          />
          <p class="text-sm text-muted">Expo must be installed on your device.</p>
          <Button class="mt-4" variant="primary">
            <IconApple />
            Download on App Store
          </Button>
        </DisclosureBody>
      </DisclosureContent>
    </Disclosure>
  </div>
`;

const setupTemplate = (args: Record<string, unknown>) => () => ({
  args,
  isExpanded: shallowRef(Boolean(args["isExpanded"])),
  qrCodeSrc: QR_CODE_SRC,
});

export const Default: Story = {
  render: (args) => ({ components, setup: setupTemplate(args), template }),
};

export const Controlled: Story = {
  render: (args) => ({
    components,
    setup: () => {
      const isExpanded = shallowRef(false);

      return {
        args,
        isExpanded,
        label: computed(() => (isExpanded.value ? "Collapse" : "Expand")),
        toggle: () => (isExpanded.value = !isExpanded.value),
      };
    },
    template: `
      <div class="w-full max-w-md space-y-4">
        <div class="flex items-center gap-4">
          <Button variant="primary" @click="toggle">{{ label }} from outside</Button>
          <Chip :color="isExpanded ? 'success' : 'default'">State: {{ isExpanded ? "Expanded" : "Collapsed" }}</Chip>
        </div>
        <Disclosure :is-disabled="args.isDisabled" :is-expanded="isExpanded" @expanded-change="isExpanded = $event">
          <DisclosureTrigger class="mb-2 flex w-full items-center justify-between rounded-md border border-gray-300 px-4 py-2 text-start hover:bg-gray-50">
            <span>Toggle content</span>
            <IconChevronDown class="size-4 transition-transform duration-200" />
          </DisclosureTrigger>
          <DisclosureContent>
            <DisclosureBody class="rounded-lg border p-4">
              <p class="text-sm">
                This disclosure is controlled from outside. You can toggle it using the button above
                or by clicking the trigger.
              </p>
            </DisclosureBody>
          </DisclosureContent>
        </Disclosure>
      </div>
    `,
  }),
};

export const ProductDetails: Story = {
  render: (args) => ({
    components,
    setup: () => ({ args, isExpanded: shallowRef(false) }),
    template: `
      <div class="w-full max-w-md">
        <Disclosure :is-disabled="args.isDisabled" :is-expanded="isExpanded" @expanded-change="isExpanded = $event">
          <DisclosureTrigger class="flex w-full items-center justify-between rounded-md border border-gray-300 px-4 py-2 text-start hover:bg-gray-50">
            <span class="flex items-center gap-2">
              <IconBox />
              View product details
            </span>
            <IconChevronUp v-if="isExpanded" class="size-4 transition-transform duration-200" />
            <IconChevronDown v-else class="size-4 transition-transform duration-200" />
          </DisclosureTrigger>
          <DisclosureContent>
            <DisclosureBody class="pt-2">
              <div class="space-y-4 rounded-lg border p-4">
                <h3 class="text-lg font-semibold">Product Details</h3>
                <div class="grid gap-2 text-sm">
                  <div class="flex justify-between">
                    <span class="text-muted-foreground">Material:</span>
                    <span>100% Cotton</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-muted-foreground">Size:</span>
                    <span>Medium (38-40)</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-muted-foreground">Color:</span>
                    <span>Navy Blue</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-muted-foreground">Care:</span>
                    <span>Machine wash cold</span>
                  </div>
                </div>
                <div class="flex gap-2 pt-2">
                  <Chip color="success">Free Shipping</Chip>
                  <Chip color="accent">1 Year Warranty</Chip>
                  <Chip color="warning">Eco-Friendly</Chip>
                </div>
              </div>
            </DisclosureBody>
          </DisclosureContent>
        </Disclosure>
      </div>
    `,
  }),
};

export const InitiallyExpanded: Story = {
  args: { isExpanded: true },
  render: (args) => ({ components, setup: setupTemplate(args), template }),
};

export const Disabled: Story = {
  args: { isDisabled: true },
  render: (args) => ({ components, setup: setupTemplate(args), template }),
};
