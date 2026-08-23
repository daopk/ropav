import type { StoryMeta } from "../../utils/story-meta";
import type { StoryObj } from "@storybook/vue3";

import { shallowRef } from "vue";
import IconEllipsis from "~icons/gravity-ui/ellipsis";
import IconEnvelope from "~icons/gravity-ui/envelope";
import IconGlobe from "~icons/gravity-ui/globe";
import IconLogoFacebook from "~icons/gravity-ui/logo-facebook";
import IconLogoGitlab from "~icons/gravity-ui/logo-gitlab";
import IconLogoTelegram from "~icons/gravity-ui/logo-telegram";
import IconLogoYandex from "~icons/gravity-ui/logo-yandex";
import IconPaperclip from "~icons/gravity-ui/paperclip";
import IconPlus from "~icons/gravity-ui/plus";
import IconTrashBin from "~icons/gravity-ui/trash-bin";

import { Spinner } from "../spinner";

import { Button, buttonVariants } from "./index";

const components = { Button, Spinner };

const meta: StoryMeta = {
  argTypes: {
    isDisabled: {
      control: { type: "boolean" },
    },
    size: {
      control: { type: "select" },
      options: ["sm", "md", "lg"],
    },
    variant: {
      control: { type: "select" },
      options: ["primary", "secondary", "tertiary", "outline", "ghost", "danger", "danger-soft"],
    },
  },
  component: Button,
  parameters: {
    layout: "centered",
  },
  title: "Components/Buttons/Button",
};

export default meta;

type Story = StoryObj<typeof meta>;

const defaultArgs = { size: "md" };

export const Default: Story = {
  args: defaultArgs,
  render: (args) => ({
    components,
    setup: () => ({
      args,
      variants: [
        { label: "Primary", variant: "primary" },
        { label: "Secondary", variant: "secondary" },
        { label: "Tertiary", variant: "tertiary" },
        { label: "Outline", variant: "outline" },
        { label: "Ghost", variant: "ghost" },
        { label: "Danger", variant: "danger" },
        { label: "Danger Soft", variant: "danger-soft" },
      ],
    }),
    template: `
      <div class="flex gap-3">
        <Button
          v-for="item in variants"
          :key="item.variant"
          :is-disabled="args.isDisabled"
          :size="args.size"
          :variant="item.variant"
        >
          {{ item.label }}
        </Button>
      </div>
    `,
  }),
};

export const Sizes: Story = {
  render: () => ({
    components: { ...components, IconEllipsis, IconPlus },
    setup: () => ({ sizes: ["sm", "md", "lg"] }),
    template: `
      <div class="flex flex-col gap-6">
        <div class="flex items-center gap-3">
          <Button v-for="size in sizes" :key="size" :size="size">{{ size }}</Button>
        </div>
        <div class="flex items-center gap-3">
          <Button v-for="size in sizes" :key="size" :size="size" variant="secondary">
            <IconPlus />
            {{ size }}
          </Button>
        </div>
        <div class="flex items-center gap-3">
          <Button v-for="size in sizes" :key="size" is-icon-only :size="size" variant="tertiary">
            <IconEllipsis />
          </Button>
        </div>
      </div>
    `,
  }),
};

export const States: Story = {
  render: () => ({
    components,
    template: `
      <div class="flex items-center gap-3">
        <Button>Default</Button>
        <Button is-disabled>Disabled</Button>
        <Button is-pending>Pending</Button>
      </div>
    `,
  }),
};

export const FullWidth: Story = {
  render: () => ({
    components: { ...components, IconPlus },
    template: `
      <div class="w-[400px] space-y-3">
        <Button full-width>Primary</Button>
        <Button full-width variant="secondary">Secondary</Button>
        <Button full-width variant="tertiary">Tertiary</Button>
        <Button full-width size="sm">Small</Button>
        <Button full-width size="lg">Large</Button>
        <Button full-width>
          <IconPlus />
          With Icon
        </Button>
      </div>
    `,
  }),
};

export const WithIcon: Story = {
  args: defaultArgs,
  render: (args) => ({
    components: { ...components, IconEnvelope, IconGlobe, IconPlus, IconTrashBin },
    setup: () => ({ args }),
    template: `
      <div class="flex gap-3">
        <Button :is-disabled="args.isDisabled" :size="args.size">
          <IconGlobe />
          Search
        </Button>
        <Button :is-disabled="args.isDisabled" :size="args.size" variant="secondary">
          <IconPlus />
          Add Member
        </Button>
        <Button :is-disabled="args.isDisabled" :size="args.size" variant="tertiary">
          <IconEnvelope />
          Email
        </Button>
        <Button :is-disabled="args.isDisabled" :size="args.size" variant="danger">
          <IconTrashBin />
          Delete
        </Button>
        <Button :is-disabled="args.isDisabled" :size="args.size" variant="danger-soft">
          <IconTrashBin />
          Cancel
        </Button>
      </div>
    `,
  }),
};

export const WithIconOnly: Story = {
  args: defaultArgs,
  render: (args) => ({
    components: { ...components, IconEllipsis },
    setup: () => ({ args }),
    template: `
      <div class="flex gap-3">
        <Button
          is-icon-only
          :is-disabled="args.isDisabled"
          :size="args.size"
          :variant="args.variant ?? 'tertiary'"
        >
          <IconEllipsis />
        </Button>
      </div>
    `,
  }),
};

export const WithSpinner: Story = {
  args: defaultArgs,
  render: (args) => ({
    components,
    setup: () => ({ args }),
    template: `
      <div class="flex gap-3">
        <Button is-pending :size="args.size" :variant="args.variant">
          <Spinner color="current" size="sm" />
          Loading
        </Button>
      </div>
    `,
  }),
};

export const WithLoadingState: Story = {
  args: defaultArgs,
  render: (args) => ({
    components: { ...components, IconPaperclip },
    setup: () => {
      const isLoading = shallowRef(false);

      const onClick = () => {
        isLoading.value = true;

        setTimeout(() => {
          isLoading.value = false;
        }, 4500);
      };

      return { args, isLoading, onClick };
    },
    template: `
      <Button
        :is-pending="isLoading"
        :size="args.size"
        :variant="args.variant ?? 'tertiary'"
        @click="onClick"
      >
        <template #default="{isPending}">
          <Spinner v-if="isPending" color="current" size="sm" />
          <IconPaperclip v-else />
          {{ isPending ? "Uploading..." : "Upload File" }}
        </template>
      </Button>
    `,
  }),
};

export const WithSocialButton: Story = {
  args: defaultArgs,
  render: (args) => ({
    components: {
      ...components,
      IconLogoFacebook,
      IconLogoGitlab,
      IconLogoTelegram,
      IconLogoYandex,
    },
    setup: () => ({ args }),
    template: `
      <div class="flex w-full max-w-xs flex-col gap-3">
        <Button :size="args.size" :variant="args.variant ?? 'tertiary'">
          <IconLogoGitlab />
          Sign in with GitLab
        </Button>
        <Button :size="args.size" :variant="args.variant ?? 'tertiary'">
          <IconLogoFacebook />
          Sign in with Facebook
        </Button>
        <Button :size="args.size" :variant="args.variant ?? 'tertiary'">
          <IconLogoTelegram />
          Sign in with Telegram
        </Button>
        <Button :size="args.size" :variant="args.variant ?? 'tertiary'">
          <IconLogoYandex />
          Sign in with Yandex
        </Button>
      </div>
    `,
  }),
};

export const WithLinkButton: Story = {
  args: defaultArgs,
  render: (args) => ({
    setup: () => ({ args, buttonVariants }),
    // Anchors take the variant classes directly, which is how a link gets the button look
    // without the component pretending to be one.
    template: `
      <a
        :class="buttonVariants({isIconOnly: args.isIconOnly, size: args.size, variant: args.variant})"
        href="https://github.com/daopk/ropav"
        rel="noopener noreferrer"
        target="_blank"
      >
        Ropav
      </a>
    `,
  }),
};
