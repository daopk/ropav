import type {Meta, StoryObj} from "@storybook/vue3";

import {shallowRef} from "vue";

import {Description} from "../description";
import {FieldError} from "../field-error";

import {Switch, SwitchContent, SwitchControl, SwitchIcon, SwitchThumb} from "./index";

import IconBellFill from "~icons/gravity-ui/bell-fill";
import IconBellSlash from "~icons/gravity-ui/bell-slash";
import IconCheck from "~icons/gravity-ui/check";
import IconMicrophone from "~icons/gravity-ui/microphone";
import IconMicrophoneSlash from "~icons/gravity-ui/microphone-slash";
import IconMoon from "~icons/gravity-ui/moon";
import IconPower from "~icons/gravity-ui/power";
import IconSun from "~icons/gravity-ui/sun";
import IconVolumeFill from "~icons/gravity-ui/volume-fill";
import IconVolumeSlashFill from "~icons/gravity-ui/volume-slash-fill";

// Registered part by part: a story template is compiled at runtime, with no binding metadata
// to resolve `Switch.Content` through, so dot notation cannot be used here.
const components = {
  Description,
  FieldError,
  IconBellFill,
  IconBellSlash,
  IconCheck,
  IconMicrophone,
  IconMicrophoneSlash,
  IconMoon,
  IconPower,
  IconSun,
  IconVolumeFill,
  IconVolumeSlashFill,
  Switch,
  SwitchContent,
  SwitchControl,
  SwitchIcon,
  SwitchThumb,
};

const meta: Meta = {
  argTypes: {
    isDisabled: {
      control: {type: "boolean"},
    },
    size: {
      control: {type: "select"},
      options: ["sm", "md", "lg"],
    },
  },
  component: Switch,
  parameters: {
    layout: "centered",
  },
  title: "Components/Controls/Switch",
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => ({
    components,
    setup: () => ({args}),
    template: `
      <Switch :is-disabled="args.isDisabled" :size="args.size">
        <SwitchContent>
          <SwitchControl>
            <SwitchThumb />
          </SwitchControl>
          Enable notifications
        </SwitchContent>
      </Switch>
    `,
  }),
};

export const Disabled: Story = {
  render: () => ({
    components,
    template: `
      <Switch is-disabled>
        <SwitchContent>
          <SwitchControl>
            <SwitchThumb />
          </SwitchControl>
          Enable notifications
        </SwitchContent>
      </Switch>
    `,
  }),
};

export const DefaultSelected: Story = {
  render: () => ({
    components,
    template: `
      <Switch default-selected>
        <SwitchContent>
          <SwitchControl>
            <SwitchThumb />
          </SwitchControl>
          Enable notifications
        </SwitchContent>
      </Switch>
    `,
  }),
};

export const DisabledDefaultSelected: Story = {
  render: () => ({
    components,
    template: `
      <Switch default-selected is-disabled aria-label="Enable notifications">
        <SwitchContent>
          <SwitchControl>
            <SwitchThumb />
          </SwitchControl>
        </SwitchContent>
      </Switch>
    `,
  }),
};

export const Controlled: Story = {
  render: () => ({
    components,
    setup: () => {
      const isSelected = shallowRef(false);

      return {isSelected};
    },
    template: `
      <div class="flex flex-col gap-4">
        <Switch v-model:is-selected="isSelected">
          <SwitchContent>
            <SwitchControl>
              <SwitchThumb />
            </SwitchControl>
            Enable notifications
          </SwitchContent>
        </Switch>
        <p class="text-sm text-muted">Switch is {{ isSelected ? "on" : "off" }}</p>
      </div>
    `,
  }),
};

export const WithoutLabel: Story = {
  render: () => ({
    components,
    template: `
      <Switch aria-label="Enable notifications">
        <SwitchContent>
          <SwitchControl>
            <SwitchThumb />
          </SwitchControl>
        </SwitchContent>
      </Switch>
    `,
  }),
};

export const Invalid: Story = {
  render: () => ({
    components,
    template: `
      <Switch is-invalid is-required name="notifications">
        <SwitchContent>
          <SwitchControl>
            <SwitchThumb />
          </SwitchControl>
          Enable notifications
        </SwitchContent>
        <FieldError>You must enable notifications to continue</FieldError>
      </Switch>
    `,
  }),
};

export const Validation: Story = {
  render: () => ({
    components,
    setup: () => ({
      validate: (isSelected: boolean) => (isSelected ? true : "You must accept to continue"),
    }),
    template: `
      <Switch is-required name="terms-switch" :validate="validate">
        <SwitchContent>
          <SwitchControl>
            <SwitchThumb />
          </SwitchControl>
          Accept terms
        </SwitchContent>
        <FieldError />
      </Switch>
    `,
  }),
};

export const Sizes: Story = {
  render: () => ({
    components,
    template: `
      <div class="flex gap-6">
        <Switch size="sm">
          <SwitchContent>
            <SwitchControl>
              <SwitchThumb />
            </SwitchControl>
            Small
          </SwitchContent>
        </Switch>
        <Switch size="md">
          <SwitchContent>
            <SwitchControl>
              <SwitchThumb />
            </SwitchControl>
            Medium
          </SwitchContent>
        </Switch>
        <Switch size="lg">
          <SwitchContent>
            <SwitchControl>
              <SwitchThumb />
            </SwitchControl>
            Large
          </SwitchContent>
        </Switch>
      </div>
    `,
  }),
};

export const LabelBefore: Story = {
  render: () => ({
    components,
    template: `
      <Switch>
        <SwitchContent>
          Enable notifications
          <SwitchControl>
            <SwitchThumb />
          </SwitchControl>
        </SwitchContent>
      </Switch>
    `,
  }),
};

export const WithDescription: Story = {
  render: () => ({
    components,
    template: `
      <div class="max-w-sm">
        <Switch>
          <SwitchContent>
            <SwitchControl>
              <SwitchThumb />
            </SwitchControl>
            Public profile
          </SwitchContent>
          <Description>Allow others to see your profile information</Description>
        </Switch>
      </div>
    `,
  }),
};

export const WithCustomStyles: Story = {
  render: () => ({
    components,
    template: `
      <Switch v-slot="{isSelected}" aria-label="Power">
        <SwitchContent>
          <SwitchControl
            class="h-[31px] w-[51px] bg-blue-500"
            :class="isSelected ? 'bg-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.5)]' : ''"
          >
            <SwitchThumb
              class="size-[27px] bg-white shadow-sm"
              :class="isSelected ? 'ms-[22px] shadow-lg' : ''"
            >
              <SwitchIcon>
                <IconCheck v-if="isSelected" class="size-4 text-cyan-600" />
                <IconPower v-else class="size-4 text-blue-600" />
              </SwitchIcon>
            </SwitchThumb>
          </SwitchControl>
        </SwitchContent>
      </Switch>
    `,
  }),
};

export const WithIcons: Story = {
  render: () => ({
    components,
    template: `
      <div class="flex gap-3">
        <Switch v-slot="{isSelected}" default-selected aria-label="lock" size="lg">
          <SwitchContent>
            <SwitchControl :class="isSelected ? 'bg-blue-500' : ''">
              <SwitchThumb>
                <SwitchIcon>
                  <IconVolumeSlashFill
                    v-if="isSelected"
                    class="size-3 text-inherit text-blue-600 opacity-100"
                  />
                  <IconVolumeFill v-else class="size-3 text-inherit opacity-70" />
                </SwitchIcon>
              </SwitchThumb>
            </SwitchControl>
          </SwitchContent>
        </Switch>
        <Switch v-slot="{isSelected}" default-selected aria-label="microphone" size="lg">
          <SwitchContent>
            <SwitchControl :class="isSelected ? 'bg-red-500' : ''">
              <SwitchThumb>
                <SwitchIcon>
                  <IconMicrophoneSlash
                    v-if="isSelected"
                    class="size-3 text-inherit text-red-600 opacity-100"
                  />
                  <IconMicrophone v-else class="size-3 text-inherit opacity-70" />
                </SwitchIcon>
              </SwitchThumb>
            </SwitchControl>
          </SwitchContent>
        </Switch>
        <Switch v-slot="{isSelected}" default-selected aria-label="check" size="lg">
          <SwitchContent>
            <SwitchControl :class="isSelected ? 'bg-green-500' : ''">
              <SwitchThumb>
                <SwitchIcon>
                  <IconCheck
                    v-if="isSelected"
                    class="size-3 text-inherit text-green-600 opacity-100"
                  />
                  <IconPower v-else class="size-3 text-inherit opacity-70" />
                </SwitchIcon>
              </SwitchThumb>
            </SwitchControl>
          </SwitchContent>
        </Switch>
        <Switch v-slot="{isSelected}" default-selected aria-label="darkMode" size="lg">
          <SwitchContent>
            <SwitchControl>
              <SwitchThumb>
                <SwitchIcon>
                  <IconSun v-if="isSelected" class="size-3 text-inherit opacity-100" />
                  <IconMoon v-else class="size-3 text-inherit opacity-70" />
                </SwitchIcon>
              </SwitchThumb>
            </SwitchControl>
          </SwitchContent>
        </Switch>
        <Switch v-slot="{isSelected}" default-selected aria-label="notification" size="lg">
          <SwitchContent>
            <SwitchControl :class="isSelected ? 'bg-purple-500' : ''">
              <SwitchThumb>
                <SwitchIcon>
                  <IconBellFill
                    v-if="isSelected"
                    class="size-3 text-inherit text-purple-600 opacity-100"
                  />
                  <IconBellSlash v-else class="size-3 text-inherit opacity-70" />
                </SwitchIcon>
              </SwitchThumb>
            </SwitchControl>
          </SwitchContent>
        </Switch>
      </div>
    `,
  }),
};

export const SlotProps: Story = {
  render: () => ({
    components,
    template: `
      <Switch v-slot="{isSelected}">
        <SwitchContent>
          <SwitchControl>
            <SwitchThumb />
          </SwitchControl>
          {{ isSelected ? "Enabled" : "Disabled" }}
        </SwitchContent>
      </Switch>
    `,
  }),
};
